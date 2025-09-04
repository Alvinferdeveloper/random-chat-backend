import { Request, Response } from 'express';
import * as HobbyService from '../services/hobby.service';

export const getAllHobbies = async (_req: Request, res: Response) => {
    const hobbies = await HobbyService.getAllHobbies();
    res.status(200).json({ success: true, data: hobbies });
};
