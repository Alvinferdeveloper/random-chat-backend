import * as HobbyRepository from '../repositories/hobby.repository';

export const getAllHobbies = async () => {
    const hobbies = await HobbyRepository.findAll();
    return hobbies;
};