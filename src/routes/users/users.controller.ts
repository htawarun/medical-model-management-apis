import { NextFunction, Request, Response } from 'express';
import httpStatus from 'http-status';

import { logger } from '../../config/winston';
import { UsersAuthUtils } from './users.auth';
import { User, UserModel } from './users.model';

const LOG_TAG = '[Users.Controller]';

export default class UsersController {
    /**
     * Load user and append to req.
     * @param {string} id - The user's id
     */
    static async load (req: Request, res: Response, next: NextFunction, id: string) {
        try {
            // eslint-disable-next-line  no-param-reassign
            req.loadedUser = await UserModel.getUser(id);
            return next();
        } catch (err) {
            logger.req().error(`${LOG_TAG} Error loading user with '${id}' to req`);
            return next(err);
        }
    }

    /** Get user */
    static async get (req: Request, res: Response) {
        res.json(req.loadedUser);
    }

    /** Create new user from the google id token */
    static async create (req: Request, res: Response, next: NextFunction) {
        const userData = await UsersAuthUtils.verifyIdToken(req);

        try {
            logger.req().info(`${LOG_TAG} attempting to create user with with email '${userData.email}'`);
            const user = await UserModel.createUser(userData.id, userData.name, userData.email);

            logger.req().info(`${LOG_TAG} successfully created user '${user._id}' with email '${userData.email}'`);
            return res.status(httpStatus.CREATED).json(user);
        } catch (err) {
            logger.req().error(`${LOG_TAG} error while creating user with email '${userData.email}'. Err: ${err}`);
            return next(err);
        }
    }

    /** Create new user from the google id token */
    static async remove (req: Request, res: Response, next: NextFunction) {
        const user = req.loadedUser;

        try {
            const removedUser = await user.remove();

            logger.req().info(`${LOG_TAG} successfully removed user '${removedUser._id}' with email '${removedUser.email}'`);
            return res.json(removedUser);
        } catch (err) {
            logger.req().error(`${LOG_TAG} error while removing user '${user._id}' with email '${user.email}'`);
            return next(err);
        }
    }
}

