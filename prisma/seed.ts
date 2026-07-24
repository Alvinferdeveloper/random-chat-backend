import prisma from '../src/lib/prisma';
import { RoomStatus } from '@prisma/client';

const hobbies = [
    { name: 'Música', icon: '🎵' },
    { name: 'Fotografía', icon: '📷' },
    { name: 'Lectura', icon: '📚' },
    { name: 'Videojuegos', icon: '🎮' },
    { name: 'Arte', icon: '🎨' },
    { name: 'Viajes', icon: '✈️' },
    { name: 'Café', icon: '☕' },
    { name: 'Fitness', icon: '💪' }
];

const categories = [
    { name: 'Deportes', icon: '⚽' },
    { name: 'Música', icon: '🎵' },
    { name: 'Gaming', icon: '🎮' },
    { name: 'Tecnología', icon: '💻' },
    { name: 'Arte', icon: '🎨' },
    { name: 'Ciencia', icon: '🔬' },
    { name: 'Entretenimiento', icon: '🎬' },
    { name: 'Noticias', icon: '📰' },
    { name: 'Anime', icon: '🎌' },
    { name: 'Salud Mental', icon: '🧠' },
    { name: 'Cine y TV', icon: '🎥' },
    { name: 'Cocina', icon: '🍳' },
    { name: 'Mascotas', icon: '🐾' },
];

type DefaultRoom = {
    name: string;
    normalized_name: string;
    short_description: string;
    full_description: string;
    server_banner: string;
    server_icon: string;
    status: RoomStatus;
    categoryNames: string[];
};

const defaultRooms: DefaultRoom[] = [
    {
        name: 'Rincón Musical',
        normalized_name: 'rincon-musical',
        short_description: 'Comparte tus gustos musicales',
        full_description: 'Un espacio para compartir canciones, descubrir nuevos artistas y hablar sobre tus géneros favoritos. Desde rock hasta música clásica, todos los estilos son bienvenidos.',
        server_banner: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=1200&h=400&fit=crop',
        server_icon: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=200&h=200&fit=crop',
        status: RoomStatus.ACCEPTED,
        categoryNames: ['Música', 'Entretenimiento'],
    },
    {
        name: 'Gamers Unite',
        normalized_name: 'gamers-unite',
        short_description: 'Conecta con otros gamers',
        full_description: 'Encuentra compañeros de juego, discute sobre los últimos lanzamientos y comparte tus mejores momentos gaming. PC, consolas, móvil - todos los gamers son bienvenidos.',
        server_banner: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200&h=400&fit=crop',
        server_icon: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=200&h=200&fit=crop',
        status: RoomStatus.ACCEPTED,
        categoryNames: ['Gaming', 'Entretenimiento'],
    },
    {
        name: 'Club de Lectura',
        normalized_name: 'club-de-lectura',
        short_description: 'Para amantes de los libros',
        full_description: 'Discute tus libros favoritos, recomienda lecturas y conoce a otros bibliófilos. Desde clásicos hasta bestsellers contemporáneos, aquí hay espacio para todas las historias.',
        server_banner: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=1200&h=400&fit=crop',
        server_icon: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=200&h=200&fit=crop',
        status: RoomStatus.ACCEPTED,
        categoryNames: ['Entretenimiento'],
    },
    {
        name: 'Café y Conversación',
        normalized_name: 'cafe-y-conversacion',
        short_description: 'Charlas casuales y relajadas',
        full_description: 'Un espacio acogedor para conversaciones tranquilas sobre cualquier tema. Como tomar un café con amigos, pero en línea. Comparte tus pensamientos y conoce gente interesante.',
        server_banner: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1200&h=400&fit=crop',
        server_icon: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=200&h=200&fit=crop',
        status: RoomStatus.ACCEPTED,
        categoryNames: ['Noticias'],
    },
    {
        name: 'Galería de Arte',
        normalized_name: 'galeria-de-arte',
        short_description: 'Creatividad y expresión artística',
        full_description: 'Comparte tus creaciones, recibe feedback constructivo y admira el trabajo de otros artistas. Pintura, dibujo, escultura, arte digital - todas las formas de arte son celebradas aquí.',
        server_banner: 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=1200&h=400&fit=crop',
        server_icon: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=200&h=200&fit=crop',
        status: RoomStatus.ACCEPTED,
        categoryNames: ['Arte', 'Entretenimiento'],
    },
    {
        name: 'Trotamundos',
        normalized_name: 'trotamundos',
        short_description: 'Historias de viajes y aventuras',
        full_description: 'Comparte tus experiencias de viaje, pide recomendaciones y planifica tu próxima aventura. Desde mochileros hasta viajeros de lujo, todos tienen una historia que contar.',
        server_banner: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1200&h=400&fit=crop',
        server_icon: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=200&h=200&fit=crop',
        status: RoomStatus.ACCEPTED,
        categoryNames: ['Noticias'],
    },
    {
        name: 'Enfoque Fotográfico',
        normalized_name: 'enfoque-fotografico',
        short_description: 'Captura y comparte momentos',
        full_description: 'Un espacio para fotógrafos de todos los niveles. Comparte tus mejores tomas, aprende nuevas técnicas y recibe críticas constructivas. Desde smartphones hasta cámaras profesionales.',
        server_banner: 'https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=1200&h=400&fit=crop',
        server_icon: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=200&h=200&fit=crop',
        status: RoomStatus.ACCEPTED,
        categoryNames: ['Arte', 'Noticias'],
    },
    {
        name: 'Zona Fitness',
        normalized_name: 'zona-fitness',
        short_description: 'Motivación y vida saludable',
        full_description: 'Comparte tus rutinas de ejercicio, logros fitness y consejos de nutrición. Un espacio de apoyo mutuo para alcanzar tus metas de salud y bienestar.',
        server_banner: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1200&h=400&fit=crop',
        server_icon: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=200&h=200&fit=crop',
        status: RoomStatus.ACCEPTED,
        categoryNames: ['Deportes'],
    },
    {
        name: 'Plaza General',
        normalized_name: 'plaza-general',
        short_description: 'Conversaciones sobre todo',
        full_description: 'El punto de encuentro principal para charlas sobre cualquier tema. Noticias, memes, preguntas random, debates amistosos - si no sabes dónde publicar, este es tu lugar.',
        server_banner: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1200&h=400&fit=crop',
        server_icon: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=200&h=200&fit=crop',
        status: RoomStatus.ACCEPTED,
        categoryNames: ['Noticias', 'Deportes', 'Gaming'],
    },
    {
        name: 'Tech Talk',
        normalized_name: 'tech-talk',
        short_description: 'Tecnología y programación',
        full_description: 'Discute sobre las últimas tendencias en tecnología, comparte proyectos de código, pide ayuda con bugs y debate sobre los mejores lenguajes de programación.',
        server_banner: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&h=400&fit=crop',
        server_icon: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=200&h=200&fit=crop',
        status: RoomStatus.ACCEPTED,
        categoryNames: ['Tecnología', 'Ciencia'],
    },
    {
        name: 'Copa Mundial FIFA 2026',
        normalized_name: 'copa-mundial-fifa-2026',
        short_description: 'Sigue el Mundial en vivo con nosotros',
        full_description: 'La sala definitiva para el Mundial 2026 en EE.UU., México y Canadá. Comenta cada jugada, predice resultados, comparte goles épicos y vive la fiesta del fútbol con fans de todo el mundo. ¡Que empiece el espectáculo!',
        server_banner: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1200&h=400&fit=crop',
        server_icon: 'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=200&h=200&fit=crop',
        status: RoomStatus.ACCEPTED,
        categoryNames: ['Deportes', 'Noticias'],
    },
    {
        name: 'UEFA Champions League',
        normalized_name: 'uefa-champions-league',
        short_description: 'Fútbol europeo de élite',
        full_description: 'Habla de la Champions League con otros fans: jornadas, fichajes, predicciones y análisis táctico. Desde los grupos hasta la final, aquí se vive cada eliminatoria con pasión.',
        server_banner: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=1200&h=400&fit=crop',
        server_icon: 'https://images.unsplash.com/photo-1508098682722-e99c643e7f0b?w=200&h=200&fit=crop',
        status: RoomStatus.ACCEPTED,
        categoryNames: ['Deportes'],
    },
    {
        name: 'Taylor Swift Fans',
        normalized_name: 'taylor-swift-fans',
        short_description: 'La Swiftie community en español',
        full_description: 'Espacio para hablar de Taylor Swift: albums, giras, easter eggs, opiniones sobre cada era y conectar con otros fans. Eres fan desde Fearless o llegaste después, aquí todos son bienvenidos.',
        server_banner: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200&h=400&fit=crop',
        server_icon: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=200&h=200&fit=crop',
        status: RoomStatus.ACCEPTED,
        categoryNames: ['Música', 'Entretenimiento'],
    },
    {
        name: 'Salud Mental',
        normalized_name: 'salud-mental',
        short_description: 'Un espacio seguro para hablar',
        full_description: 'Un lugar sin juicios donde puedes expresar cómo te sientes, compartir experiencias y recibir apoyo de personas que entienden lo que estás pasando. No estás solo/a. Si necesitas ayuda profesional, te orientamos.',
        server_banner: 'https://images.unsplash.com/photo-1499209974431-9dddcece7f88?w=1200&h=400&fit=crop',
        server_icon: 'https://images.unsplash.com/photo-1474418397713-7ede21d49118?w=200&h=200&fit=crop',
        status: RoomStatus.ACCEPTED,
        categoryNames: ['Salud Mental'],
    },
    {
        name: 'Amigos Virtuales',
        normalized_name: 'amigos-virtuales',
        short_description: 'Si te sientes solo, aquí no lo estás',
        full_description: 'Una comunidad para personas que buscan compañía y conexión genuina. Cuéntanos tu día, comparte un meme, o simplemente saluda. Aquí todos son bienvenidos y nadie se queda solo.',
        server_banner: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1200&h=400&fit=crop',
        server_icon: 'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?w=200&h=200&fit=crop',
        status: RoomStatus.ACCEPTED,
        categoryNames: ['Salud Mental', 'Entretenimiento'],
    },
    {
        name: 'Anime & Manga',
        normalized_name: 'anime-y-manga',
        short_description: 'Otaku zone: anime, manga y más',
        full_description: 'Tu espacio para hablar de anime, manga, manhwa y cultura japonesa. Recomienda series, discute episodios, comparte fanart y conecta con otros otaku. De Naruto a Jujutsu Kaisen, todo se vale.',
        server_banner: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=1200&h=400&fit=crop',
        server_icon: 'https://images.unsplash.com/photo-1613376023733-0a73315d9b06?w=200&h=200&fit=crop',
        status: RoomStatus.ACCEPTED,
        categoryNames: ['Anime', 'Entretenimiento'],
    },
    {
        name: 'K-Pop Universe',
        normalized_name: 'kpop-universe',
        short_description: 'K-pop, fandoms y comeback season',
        full_description: 'Habla de tus groups favoritos: BTS, BLACKPINK, Stray Kids, NewJeans y más. Comenta comebacks, comparte choreos, discute teorías y vive la experiencia K-pop con otros fans.',
        server_banner: 'https://images.unsplash.com/photo-1598387993281-cecf8b71a8f8?w=1200&h=400&fit=crop',
        server_icon: 'https://images.unsplash.com/photo-1571266028243-e4733b0f0bb0?w=200&h=200&fit=crop',
        status: RoomStatus.ACCEPTED,
        categoryNames: ['Música', 'Entretenimiento'],
    },
    {
        name: 'Cine y Series',
        normalized_name: 'cine-y-series',
        short_description: 'Películas, series y streaming',
        full_description: 'De Netflix a cines, de series coreanas a blockbusters de Hollywood. Recomienda títulos, comenta finales polémicos y debate sobre los mejores y peores de la pantalla.',
        server_banner: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1200&h=400&fit=crop',
        server_icon: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=200&h=200&fit=crop',
        status: RoomStatus.ACCEPTED,
        categoryNames: ['Cine y TV', 'Entretenimiento'],
    },
    {
        name: 'Cocina y Recetas',
        normalized_name: 'cocina-y-recetas',
        short_description: 'Recetas, tips y pasión por cocinar',
        full_description: 'Comparte tus recetas favoritas, aprende técnicas nuevas y descubre cocinas del mundo. Desde platillos rápidos hasta repostería avanzada, aquí se cocina con comunidad.',
        server_banner: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=1200&h=400&fit=crop',
        server_icon: 'https://images.unsplash.com/photo-1507048331197-7d4ac70811cf?w=200&h=200&fit=crop',
        status: RoomStatus.ACCEPTED,
        categoryNames: ['Cocina', 'Entretenimiento'],
    },
    {
        name: 'Mascotas y Cuidado Animal',
        normalized_name: 'mascotas-y-cuidado-animal',
        short_description: 'Amor por los animalitos',
        full_description: 'Para todos los amantes de las mascotas: comparte fotos de tu peludo, pide consejos de cuidado, habla de adopción y conecta con otros que también creen que los animales son familia.',
        server_banner: 'https://images.unsplash.com/photo-1450778869180-e77b1b5d23c8?w=1200&h=400&fit=crop',
        server_icon: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=200&h=200&fit=crop',
        status: RoomStatus.ACCEPTED,
        categoryNames: ['Mascotas'],
    },
    {
        name: 'Espacio y Astronomía',
        normalized_name: 'espacio-y-astronomia',
        short_description: 'El universo te espera',
        full_description: 'Explora el cosmos: desde agujeros negros hasta misiones espaciales. Habla de la NASA, planetas, estrellas y todo lo que está allá arriba. Ideal para soñadores y curiosos del espacio.',
        server_banner: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=1200&h=400&fit=crop',
        server_icon: 'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=200&h=200&fit=crop',
        status: RoomStatus.ACCEPTED,
        categoryNames: ['Ciencia', 'Noticias'],
    },
    {
        name: 'Fútbol Latinoamericano',
        normalized_name: 'futbol-latinoamericano',
        short_description: 'La pasión del fútbol suramericano',
        full_description: 'Liga MX, Liga Argentina, Brasileirão, Libertadores, Selecciones. Habla del fútbol que late en Latinoamérica: goles, jugadas, transferencias y la emoción de cada jornada.',
        server_banner: 'https://images.unsplash.com/photo-1551958219-acbc608c6377?w=1200&h=400&fit=crop',
        server_icon: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=200&h=200&fit=crop',
        status: RoomStatus.ACCEPTED,
        categoryNames: ['Deportes'],
    },
    {
        name: 'Programadores en Español',
        normalized_name: 'programadores-en-espanol',
        short_description: 'Código, bugs y café en español',
        full_description: 'Comunidad de programadores hispanohablantes: comparte proyectos, pide ayuda con errores, discute frameworks y aprende junto a otros devs. Frontend, backend, DevOps - todos son bienvenidos.',
        server_banner: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=1200&h=400&fit=crop',
        server_icon: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=200&h=200&fit=crop',
        status: RoomStatus.ACCEPTED,
        categoryNames: ['Tecnología'],
    },
    {
        name: 'Memes y Humor',
        normalized_name: 'memes-y-humor',
        short_description: 'Ríe un rato con nosotros',
        full_description: 'El lugar perfecto para compartir memes, chistes, situaciones graciosas y todo lo que te saque una sonrisa. El humor es el mejor antiestrés, y aquí lo tenemos en abundancia.',
        server_banner: 'https://images.unsplash.com/photo-1533738363-b7f9aef128ce?w=1200&h=400&fit=crop',
        server_icon: 'https://images.unsplash.com/photo-1574158622682-e40e69881006?w=200&h=200&fit=crop',
        status: RoomStatus.ACCEPTED,
        categoryNames: ['Entretenimiento'],
    }
];

async function main() {
    console.log('🌱 Iniciando seed de la base de datos...\n');

    // Seed de hobbies
    console.log('📚 Creando hobbies...');
    for (const hobby of hobbies) {
        await prisma.hobby.upsert({
            where: { name: hobby.name },
            update: { icon: hobby.icon },
            create: { name: hobby.name, icon: hobby.icon },
        });
    }
    console.log(`✅ ${hobbies.length} hobbies creados\n`);

    // Seed de categorías
    console.log('📂 Creando categorías...');
    for (const category of categories) {
        await prisma.category.upsert({
            where: { name: category.name },
            update: { icon: category.icon },
            create: { name: category.name, icon: category.icon },
        });
    }
    console.log(`✅ ${categories.length} categorías creadas\n`);

    // Seed de salas por defecto con categorías
    console.log('🏠 Creando salas por defecto con categorías...');
    for (const room of defaultRooms) {
        const { categoryNames, ...roomData } = room;

        const existingRoom = await prisma.room.findUnique({
            where: { normalized_name: room.normalized_name },
            select: { id: true }
        });

        if (existingRoom) {
            await prisma.room.update({
                where: { id: existingRoom.id },
                data: {
                    verified: true,
                    name: room.name,
                    short_description: room.short_description,
                    full_description: room.full_description,
                    server_banner: room.server_banner,
                    server_icon: room.server_icon,
                }
            });
            // Sync categories: delete existing and recreate
            await prisma.roomCategory.deleteMany({ where: { roomId: existingRoom.id } });
            if (categoryNames.length > 0) {
                const cats = await prisma.category.findMany({
                    where: { name: { in: categoryNames } },
                    select: { id: true }
                });
                if (cats.length > 0) {
                    await prisma.roomCategory.createMany({
                        data: cats.map(cat => ({ roomId: existingRoom.id, categoryId: cat.id }))
                    });
                }
            }
        } else {
            const cats = categoryNames.length > 0
                ? await prisma.category.findMany({
                    where: { name: { in: categoryNames } },
                    select: { id: true }
                })
                : [];

            await prisma.room.create({
                data: {
                    ...roomData,
                    verified: true,
                    ...(cats.length > 0 ? {
                        categories: {
                            create: cats.map(cat => ({ categoryId: cat.id }))
                        }
                    } : {})
                }
            });
        }
    }
    console.log(`✅ ${defaultRooms.length} salas creadas con categorías\n`);

    // Seed de settings globales
    const defaultSettings = [
        { key: 'room_creation_enabled', value: 'true', description: 'Controla si los usuarios pueden crear nuevas salas' },
        { key: 'registration_enabled', value: 'true', description: 'Controla si el registro de nuevos usuarios está activo' },
        { key: 'maintenance_mode', value: 'false', description: 'Modo mantenimiento global (la app muestra pantalla de mantenimiento y solo admite administradores)' },
        { key: 'chat_enabled', value: 'true', description: 'Controla si la funcionalidad de chat general está activa' },
        { key: 'chat_gifs_enabled', value: 'true', description: 'Habilita o deshabilita el envío de GIFs en el chat' },
        { key: 'chat_images_enabled', value: 'true', description: 'Habilita o deshabilita el envío de imágenes en el chat' },
        { key: 'chat_audio_enabled', value: 'true', description: 'Habilita o deshabilita las notas de voz en el chat' },
        { key: 'chat_files_enabled', value: 'true', description: 'Habilita o deshabilita el envío de archivos en el chat' },
    ];

    console.log('⚙️ Creando configuraciones globales...');
    for (const setting of defaultSettings) {
        await prisma.globalSetting.upsert({
            where: { key: setting.key },
            update: { value: setting.value, description: setting.description },
            create: { key: setting.key, value: setting.value, description: setting.description },
        });
    }
    console.log(`✅ ${defaultSettings.length} configuraciones globales creadas\n`);

    console.log('🎉 Seed completado exitosamente!');
}

main()
    .catch(e => {
        console.error('❌ Error durante el seed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });