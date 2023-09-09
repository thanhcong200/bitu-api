import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from 'src/schemas/User.schema';
import { SearchUserDto } from './dto/search-user.dto';
import { Utils } from 'src/common/utils';
import mongoose from 'mongoose';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  findAll(requestData: SearchUserDto) {
    const pipeline: mongoose.PipelineStage[] = [];
    const match = {};
    if (requestData.keyword) {
      match['$or'] = [
        { username: { $regex: requestData.keyword, $options: 'i' } },
      ];
    }
    pipeline.push({ $match: match });
    pipeline.push({
      $project: {
        _id: 1,
        username: 1,
        avatar: 1,
        isOnline: 1,
      },
    });
    return Utils.aggregatePaginate(this.userModel, pipeline, requestData);
  }

  findById(id: string) {
    return this.userModel.findOne(
      { _id: Utils.toObjectId(id) },
      { _id: 1, username: 1, avatar: 1, isOnline: 1 },
    );
  }

  findAllGroupByUserId(requestData) {
    const pipeline: mongoose.PipelineStage[] = [];
    return Utils.aggregatePaginate(this.userModel, pipeline, requestData);
  }
}
