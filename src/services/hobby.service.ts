import * as HobbyRepository from '../repositories/hobby.repository';
import { cacheService } from '../lib/cache';

const HOBBIES_CACHE_KEY = 'hobbies:all';
const HOBBIES_CACHE_TTL_MS = 600000; // 10 minutes

export const getAllHobbies = async () => {
    const cached = await cacheService.get<any[]>(HOBBIES_CACHE_KEY);
    if (cached) return cached;
    
    const hobbies = await HobbyRepository.findAll();
    await cacheService.set(HOBBIES_CACHE_KEY, hobbies, HOBBIES_CACHE_TTL_MS);
    return hobbies;
};