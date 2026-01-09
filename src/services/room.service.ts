import * as RoomRepository from '../repositories/room.repository';

export const roomExists = async (id: string) => {
    return RoomRepository.findById(id);
};

/**
 * Retrieves a paginated list of all rooms.
 * @param page - The page number.
 * @param limit - The number of items per page.
 * @returns The paginated room data.
 */
export const getAllRooms = async (page: number, limit: number) => {
    const paginatedRooms = await RoomRepository.findAllPaginated(page, limit);
    return paginatedRooms;
};