import { Injectable } from '@nestjs/common';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from 'src/schemas/User.schema';
import { Model } from 'mongoose';
import { Message, MessageDocument } from 'src/schemas/Message.schema';
import { Room, RoomDocument } from 'src/schemas/Room.schema';
import { Utils } from 'src/common/utils';
import { ApiError } from 'src/common/api';
import { ErrorCode } from 'src/common/constants';
import mongoose from 'mongoose';
import { RoomSearchDto } from './dto/room-search.dto';
import { ReceiveMessageDto } from './dto/receive-message.dto';
import { SeenMessageDto } from './dto/seen-message.dto';
import { CommonService } from 'src/common-service/common-service.service';

@Injectable()
export class RoomService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Message.name)
    private readonly messageModel: Model<MessageDocument>,
    @InjectModel(Room.name) private readonly roomModel: Model<RoomDocument>,
    @InjectConnection() private readonly connection: mongoose.Connection,
    private readonly commonService: CommonService,
  ) {}
  async create(createRoomDto: CreateRoomDto, senderId: string) {
    let validMembersId = createRoomDto.members
      .split(',')
      .filter((id) => id.trim().length > 0);
    validMembersId = [...new Set(validMembersId)];
    if (validMembersId.length === 1 && validMembersId[0] === senderId)
      throw ApiError(ErrorCode.INVALID_DATA, 'Invalid data');
    const membersId = validMembersId.map((id) => Utils.toObjectId(id));
    const [users, rooms] = await Promise.all([
      this.userModel.find({ _id: { $in: membersId } }).lean(),
      this.roomModel.find({ 'members.id': { $in: membersId } }).lean(),
    ]);
    const existRoom = rooms.find((room) => {
      const ids = room.members.map((member) => member.id.toString());
      return ids.includes(validMembersId[0]) && ids.includes(validMembersId[1]);
    });
    // check exist group
    if (users.length != 2 || existRoom)
      throw ApiError(ErrorCode.INVALID_DATA, 'Invalid data');

    let partner = {};
    const members = users.map((user) => {
      const member = {
        id: user._id,
        username: user.username,
        avatar: user.avatar,
        messageId: null,
      };
      if (user._id.toString() !== senderId.toString()) {
        partner = { ...member, isOnline: user.isOnline };
      }

      return member;
    });
    const room = await this.roomModel.create({ name: null, members });
    await this.commonService.setCache(room._id.toString(), validMembersId);
    await room.save();
    return {
      _id: room._id,
      members: members,
      partner,
      lastMessage: null,
    };
  }

  findAll(userId: string, requestData: RoomSearchDto) {
    const pipeline: mongoose.PipelineStage[] = [
      {
        $match: {
          'members.id': { $in: [Utils.toObjectId(userId)] },
        },
      },
      {
        $project: {
          _id: 1,
          members: 1,
          partner: {
            $first: {
              $filter: {
                input: '$members',
                as: 'infMember',
                cond: { $ne: ['$$infMember.id', Utils.toObjectId(userId)] },
              },
            },
          },
          lastMessage: 1,
        },
      },
    ];
    return Utils.aggregatePaginate(this.roomModel, pipeline, {
      ...requestData,
      sort: {
        'lastMessage.createdAt': 'desc',
      },
    });
  }

  findOne(id: string, requestData: RoomSearchDto) {
    const pipeline: mongoose.PipelineStage[] = [
      {
        $match: {
          roomId: Utils.toObjectId(id),
        },
      },
    ];
    return Utils.aggregatePaginate(this.messageModel, pipeline, {
      ...requestData,
      sort: { createdAt: 'asc' },
    });
  }

  async receiveMessage(requestData: ReceiveMessageDto) {
    const { roomId, senderId, message, _id } = requestData;
    const [user, room] = await Promise.all([
      this.userModel.findById(senderId).lean(),
      this.roomModel
        .findOne({
          _id: Utils.toObjectId(roomId),
          'members.id': { $in: [Utils.toObjectId(senderId)] },
        })
        .lean(),
    ]);
    if (!user || !room) throw ApiError(ErrorCode.INVALID_DATA, 'invalid data');
    const messageObj = await this.messageModel.create({
      _id: _id,
      roomId: Utils.toObjectId(roomId),
      sender: {
        id: user._id,
        username: user.username,
        avatar: user.avatar,
      },
      message,
    });
    room.members.forEach((member) => {
      if (member.id.toString() === user._id.toString()) {
        member.messageId = messageObj._id;
      }
    });
    const session = await this.connection.startSession();
    session.withTransaction(async () => {
      await Promise.all([
        messageObj.save(),
        this.roomModel.findByIdAndUpdate(roomId, {
          $set: { lastMessage: messageObj, members: room.members },
        }),
      ]);
    });

    return {
      message: messageObj,
      members: room.members,
    };
  }

  async getRoomMembers(roomId: string) {
    const room = await this.roomModel.findById(roomId).lean();
    return room.members.map((member) => member.id);
  }

  async seenMessage(requestData: SeenMessageDto) {}

  getLookupFromRoom() {
    return {
      $lookup: {
        from: 'messages',
        let: { localField: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: ['$$localField', '$roomId'],
              },
            },
          },
          {
            $project: {
              id: '$id',
              senderId: '$senderId',
              message: '$message',
              createdAt: '$createdAt',
            },
          },
          {
            $lookup: {
              from: 'users',
              let: { localField: '$senderId' },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $eq: ['$$localField', '$_id'],
                    },
                  },
                },
                {
                  $project: {
                    id: '$id',
                    username: '$username',
                  },
                },
              ],
              as: 'sender',
            },
          },
          {
            $sort: {
              createdAt: -1,
            },
          },
        ],
        as: 'messagesRoom',
      },
    };
  }
}
