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
    const membersId = createRoomDto.members
      .split(',')
      .filter((id) => id.trim().length > 0)
      .map((id) => Utils.toObjectId(id));
    const [users, existGroup] = await Promise.all([
      this.userModel.find({ _id: { $in: membersId } }).lean(),
      this.roomModel.findOne({ 'members.id': { $in: membersId } }).lean(),
    ]);

    // check exist group
    if (users.length < 2 || existGroup)
      throw ApiError(ErrorCode.INVALID_DATA, 'Invalid data');

    const members = users.map((user) => {
      return {
        id: user._id,
        messageId: null,
      };
    });
    const room = await this.roomModel.create({ name: null, members });
    return room.save();
  }

  findAll(requestData: RoomSearchDto) {
    const { userId } = requestData;
    const pipeline: mongoose.PipelineStage[] = [
      {
        $match: {
          'members.id': { $in: [Utils.toObjectId(userId)] },
        },
      },
      {
        $lookup: {
          from: 'users',
          let: { localField: '$members.id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $in: ['$_id', '$$localField'],
                },
              },
            },
            {
              $project: {
                _id: 0,
                id: '$_id',
                username: '$username',
                avatar: '$avatar',
              },
            },
          ],
          as: 'members',
        },
      },
      {
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
                      avatar: '$avatar',
                    },
                  },
                ],
                as: 'sender',
              },
            },
            {
              $project: {
                id: '$id',
                sender: { $first: '$sender' },
                message: '$message',
                createdAt: '$createdAt',
              },
            },
            {
              $sort: {
                createdAt: 1,
              },
            },
          ],
          as: 'messagesRoom',
        },
      },
    ];
    return Utils.aggregatePaginate(this.roomModel, pipeline, requestData);
  }

  findOne(id: string) {
    const pipeline: mongoose.PipelineStage[] = [
      {
        $match: {
          _id: Utils.toObjectId(id),
        },
      },
      {
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
                      avatar: '$avatar',
                    },
                  },
                ],
                as: 'sender',
              },
            },
            {
              $project: {
                id: '$id',
                sender: { $first: '$sender' },
                message: '$message',
                createdAt: '$createdAt',
              },
            },
            {
              $sort: {
                createdAt: 1,
              },
            },
          ],
          as: 'messagesRoom',
        },
      },
    ];
    return Utils.aggregatePaginate(this.roomModel, pipeline, {
      page: 1,
      limit: 10,
    });
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
      senderId: user._id,
      message,
    });
    room.members.forEach((member) => {
      if (member.id.toString() === user._id.toString()) {
        member.messageId = messageObj._id;
      }
    });
    return Promise.all([
      messageObj.save(),
      this.roomModel.findByIdAndUpdate(roomId, {}),
    ]);
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
