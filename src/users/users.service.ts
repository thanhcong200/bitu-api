import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from 'src/schemas/User.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { SearchUserDto } from './dto/search-user.dto';
import { Utils } from 'src/common/utils';
import mongoose from 'mongoose';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  findAll(requestData: SearchUserDto) {
    const match = {};
    if (requestData.keyword) {
      match['$or'] = [
        { username: { $regex: requestData.keyword, $options: 'i' } },
      ];
    }
    return Utils.aggregatePaginate(this.userModel, match, requestData);
  }

  findById(id: string) {
    return this.userModel.findOne({ id });
  }

  findAllGroupByUserId(requestData) {
    const pipeline: mongoose.PipelineStage[] = [];
    return Utils.aggregatePaginate(this.userModel, pipeline, requestData);
  }
}
