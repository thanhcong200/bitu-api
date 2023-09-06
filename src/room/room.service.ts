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
      .map((id) => Utils.toObjectId(id));
    const [users, existGroup] = await Promise.all([
      this.userModel.find({ id: { $in: membersId } }).lean(),
      this.roomModel.findOne({ 'members.id': { $in: membersId } }).lean(),
    ]);
    if (users.length < 2 || existGroup)
      throw ApiError(ErrorCode.INVALID_DATA, 'Invalid data');

    const members = users.map((user) => {
      return {
        id: user._id,
        username: user.username,
        isSeen: false,
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
          'members.id': { $in: [userId] },
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
              $sort: {
                createdAt: -1,
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
              $sort: {
                createdAt: -1,
              },
            },
          ],
          as: 'messagesRoom',
        },
      },
    ];
    return Utils.aggregatePaginate(this.roomModel, pipeline, {});
  }
}
