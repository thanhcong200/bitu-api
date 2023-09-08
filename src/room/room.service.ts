import { Injectable } from '@nestjs/common';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { InjectModel } from '@nestjs/mongoose';
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

@Injectable()
export class RoomService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Message.name)
    private readonly messageModel: Model<MessageDocument>,
    @InjectModel(Room.name) private readonly roomModel: Model<RoomDocument>,
  ) {}
  async create(createRoomDto: CreateRoomDto) {
    const validMembersId = createRoomDto.members
      .split(',')
      .filter((id) => id.trim().length > 0);
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

    const members = users.map((user) => {
      return {
        id: user._id,
        username: user.username,
        avatar: user.avatar,
        messageId: null,
      };
    });
    const room = await this.roomModel.create({ name: null, members });
    return room.save();
  }

  findAll(userId: string, requestData: RoomSearchDto) {
    const pipeline: mongoose.PipelineStage[] = [
      {
        $match: {
          'sender.id': Utils.toObjectId(userId),
        },
      },
      {
        $sort: {
          createdAt: -1,
        },
      },
      {
        $group: { _id: '$roomId' },
        lastMessage: 
      },
    ];
    return Utils.aggregatePaginate(this.messageModel, pipeline, requestData);
  }

  findOne(id: string, requestData: RoomSearchDto) {
    const pipeline: mongoose.PipelineStage[] = [
      {
        $match: {
          roomId: Utils.toObjectId(id),
        },
      },
    ];
    return Utils.aggregatePaginate(this.messageModel, pipeline, requestData);
  }

  async receiveMessage(requestData: ReceiveMessageDto) {
    const { roomId, senderId, message } = requestData;
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
    await Promise.all([
      messageObj.save(),
      this.roomModel.findByIdAndUpdate(roomId, {}),
    ]);
    return {
      _id: messageObj._id,
      roomId: roomId,
      sender: { _id: user._id, username: user.username, avatar: user.avatar },
      name: room.name,
      message: messageObj.message,
    };
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
