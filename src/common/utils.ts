import { Logger } from '@nestjs/common';
import ObjectID from 'bson-objectid';
import mongoose, { Types } from 'mongoose';
const CryptoJS = require('crypto-js');
import { PagingDocument } from './common-type';
import { ErrorCode } from './constants';
import { ApiError } from './api';
const jwt = require('jsonwebtoken');
export class Utils {
  private static readonly logger = new Logger(Utils.name);

  /**
   * Check string is Mongo ObjectId
   * @param {string} str
   * @return {boolean}
   */
  public static isObjectId(str: string) {
    try {
      new Types.ObjectId(str);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Convert string to Mongo ObjectId
   * @param {any} str
   * @return {Types.ObjectId}
   */
  public static toObjectId(str: any) {
    try {
      return new Types.ObjectId(str);
    } catch (error) {
      throw ApiError(ErrorCode.INVALID_DATA, error.message);
    }
  }

  /**
   * Create mongodb id
   * @return {Types.ObjectId}
   */
  public static createObjectId() {
    return new Types.ObjectId(new ObjectID());
  }

  /**
   * Convert array string to array Mongo ObjectId
   * @param {string[]} strs
   * @return {Types.ObjectId[]}
   */
  public static toObjectIds(strs: string[]) {
    return strs.map((str) => this.toObjectId(str));
  }

  /**
   * Get random element from array
   * @param {any[]} array
   * @return {any}
   */
  public static getRandom(array: any[]) {
    return array[Math.floor(Math.random() * array.length)];
  }

  /**
   * Wait
   * @param {number} ms
   * @return {Promise}
   */
  public static wait(ms) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }

  /**
   * Retry a promoise function
   * @param {any} operation
   * @param {number} retries
   * @param {number} delay
   * @return {Promise<any>}
   */
  public static retryFn(operation, retries = 3, delay = 500) {
    return new Promise((resolve, reject) => {
      return operation()
        .then(resolve)
        .catch((reason) => {
          if (retries > 0) {
            return Utils.wait(delay)
              .then(this.retryFn.bind(null, operation, retries - 1, delay))
              .then(resolve)
              .catch(reject);
          }
          return reject(reason);
        });
    });
  }

  /**
   * Get user from header
   * @param {Request} req
   * @return {UserJWT}
   */
  public static async getUser(req: Request) {
    try {
      if (
        req.headers['authorization'] &&
        req.headers['authorization'].split(' ')[0] === 'Bearer'
      ) {
        const jwtToken = req.headers['authorization'].split(' ')[1];
        return jwt.verify(jwtToken, process.env.JWT_SECRET);
      }
    } catch (error) {
      return null;
    }
  }
  /**
   * Convert bytes to bytes
   * @param {string} str
   * @return {string}
   */
  public static convertBytesToString(str: string) {
    return str.substring(2);
  }

  /**
   * Paginate
   * @param {any} model
   * @param {any} pipe
   * @param {any} query
   * @return {Promise<PagingDocument>}
   */
  public static aggregatePaginate(model: any, pipe: any, query: any) {
    this.logger.debug('aggregatePaginate(): match', JSON.stringify(pipe));
    const pagingOptions: any = {
      limit: query.limit,
      sort: query.sort ? query.sort : { createdAt: 'desc' },
    };
    if (query.offset >= 0) {
      pagingOptions['offset'] = query.offset;
    } else if (query.page) {
      pagingOptions['page'] = query.page;
    }
    if (query.projection) {
      pagingOptions.projection = query.projection;
    }
    return model.aggregatePaginate(
      model.aggregate(pipe),
      pagingOptions,
    ) as Promise<PagingDocument>;
  }

  public static isEmpty(str) {
    return !str || str.length === 0;
  }

  public static isParamExists(param) {
    return param !== undefined ? true : false;
  }

  public static toDecimal(str: any) {
    return mongoose.Types.Decimal128.fromString(str.toString());
  }
}
