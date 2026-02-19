import { createRoom, getAllRooms } from '../../services/room.service';
import * as RoomRepository from '../../repositories/room.repository';
import ApiError from '../../utils/ApiError';
import { getRedisClient } from '../../lib/redis';

// Mock dependencies
jest.mock('../../repositories/room.repository');
jest.mock('../../lib/redis');
jest.mock('../../lib/supabase', () => ({
    supabase: {
        storage: {
            from: jest.fn().mockReturnThis(),
            createSignedUploadUrl: jest.fn(),
            getPublicUrl: jest.fn()
        }
    }
}));

describe('RoomService', () => {
    describe('createRoom', () => {
        const mockUser = 'user-123';
        const mockRoomData = {
            name: 'Test Room',
            short_description: 'Short desc',
            full_description: 'Full description',
            server_banner: 'http://banner.com',
            server_icon: 'http://icon.com',
            ownerId: mockUser,
            normalized_name: 'testroom',
            verified: false,
            status: 'ACCEPTED' as const,
            deletedAt: null,
        };

        const mockRepoCreate = RoomRepository.create as jest.Mock;
        const mockRepoExists = RoomRepository.existsByNameNormalized as jest.Mock;

        beforeEach(() => {
            jest.clearAllMocks();
            // Default: Redis is not active or returns null
            (getRedisClient as jest.Mock).mockReturnValue(null);
        });

        it('should create a room successfully when name is unique', async () => {
            mockRepoExists.mockResolvedValue(false);
            mockRepoCreate.mockResolvedValue({ ...mockRoomData, id: 'room-1' });

            const result = await createRoom(mockRoomData, mockUser);

            expect(result).toHaveProperty('id', 'room-1');
            expect(mockRepoExists).toHaveBeenCalledWith('testroom');
            expect(mockRepoCreate).toHaveBeenCalled();
        });

        it('should throw error if room name is too short', async () => {
            await expect(createRoom({ ...mockRoomData, name: 'ab' }, mockUser))
                .rejects.toThrow(ApiError);
        });

        it('should throw error if room with similar name exists', async () => {
            mockRepoExists.mockResolvedValue(true);

            await expect(createRoom(mockRoomData, mockUser))
                .rejects.toThrow('A room with a very similar name already exists');
        });
    });

    describe('getAllRooms', () => {
        const mockFindAllPaginated = RoomRepository.findAllPaginated as jest.Mock;

        const paginatedResponse = {
            data: [{ id: 'room-1', name: 'Gaming Hub', normalized_name: 'gaminghub' }],
            pagination: { currentPage: 1, totalPages: 1, totalItems: 1, hasNextPage: false }
        };

        beforeEach(() => {
            jest.clearAllMocks();
        });

        it('should return all rooms without a search filter', async () => {
            mockFindAllPaginated.mockResolvedValue(paginatedResponse);

            const result = await getAllRooms(1, 10);

            expect(mockFindAllPaginated).toHaveBeenCalledWith(1, 10, false, undefined);
            expect(result.data).toHaveLength(1);
        });

        it('should normalize the search term and forward it to the repository', async () => {
            mockFindAllPaginated.mockResolvedValue(paginatedResponse);

            await getAllRooms(1, 10, 'Gámíng');

            // Normalized: accents removed and lowercased → 'gaming'
            expect(mockFindAllPaginated).toHaveBeenCalledWith(1, 10, false, 'gaming');
        });

        it('should return empty data when no room matches the search term', async () => {
            const emptyResponse = {
                data: [],
                pagination: { currentPage: 1, totalPages: 0, totalItems: 0, hasNextPage: false }
            };
            mockFindAllPaginated.mockResolvedValue(emptyResponse);

            const result = await getAllRooms(1, 10, 'zzznomatch');

            expect(result.data).toHaveLength(0);
            expect(result.pagination.totalItems).toBe(0);
        });
    });
});
