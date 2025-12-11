import * as RoomRepository from '../repositories/room.repository';

export const roomExists = async (id: string) => {
    return RoomRepository.findById(id);
};

export const getAllRooms = async () => {
    const rooms = await RoomRepository.findAll();
    return rooms;
};
