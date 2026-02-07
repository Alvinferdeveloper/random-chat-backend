import prisma from '../src/lib/prisma';

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

const defaultRooms = [
    {
        name: 'Rincón Musical',
        normalized_name: 'rincon-musical',
        short_description: 'Comparte tus gustos musicales',
        full_description: 'Un espacio para compartir canciones, descubrir nuevos artistas y hablar sobre tus géneros favoritos. Desde rock hasta música clásica, todos los estilos son bienvenidos.',
        server_banner: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=1200&h=400&fit=crop',
        server_icon: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=200&h=200&fit=crop'
    },
    {
        name: 'Gamers Unite',
        normalized_name: 'gamers-unite',
        short_description: 'Conecta con otros gamers',
        full_description: 'Encuentra compañeros de juego, discute sobre los últimos lanzamientos y comparte tus mejores momentos gaming. PC, consolas, móvil - todos los gamers son bienvenidos.',
        server_banner: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200&h=400&fit=crop',
        server_icon: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=200&h=200&fit=crop'
    },
    {
        name: 'Club de Lectura',
        normalized_name: 'club-de-lectura',
        short_description: 'Para amantes de los libros',
        full_description: 'Discute tus libros favoritos, recomienda lecturas y conoce a otros bibliófilos. Desde clásicos hasta bestsellers contemporáneos, aquí hay espacio para todas las historias.',
        server_banner: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=1200&h=400&fit=crop',
        server_icon: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=200&h=200&fit=crop'
    },
    {
        name: 'Café y Conversación',
        normalized_name: 'cafe-y-conversacion',
        short_description: 'Charlas casuales y relajadas',
        full_description: 'Un espacio acogedor para conversaciones tranquilas sobre cualquier tema. Como tomar un café con amigos, pero en línea. Comparte tus pensamientos y conoce gente interesante.',
        server_banner: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1200&h=400&fit=crop',
        server_icon: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=200&h=200&fit=crop'
    },
    {
        name: 'Galería de Arte',
        normalized_name: 'galeria-de-arte',
        short_description: 'Creatividad y expresión artística',
        full_description: 'Comparte tus creaciones, recibe feedback constructivo y admira el trabajo de otros artistas. Pintura, dibujo, escultura, arte digital - todas las formas de arte son celebradas aquí.',
        server_banner: 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=1200&h=400&fit=crop',
        server_icon: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=200&h=200&fit=crop'
    },
    {
        name: 'Trotamundos',
        normalized_name: 'trotamundos',
        short_description: 'Historias de viajes y aventuras',
        full_description: 'Comparte tus experiencias de viaje, pide recomendaciones y planifica tu próxima aventura. Desde mochileros hasta viajeros de lujo, todos tienen una historia que contar.',
        server_banner: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1200&h=400&fit=crop',
        server_icon: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=200&h=200&fit=crop'
    },
    {
        name: 'Enfoque Fotográfico',
        normalized_name: 'enfoque-fotografico',
        short_description: 'Captura y comparte momentos',
        full_description: 'Un espacio para fotógrafos de todos los niveles. Comparte tus mejores tomas, aprende nuevas técnicas y recibe críticas constructivas. Desde smartphones hasta cámaras profesionales.',
        server_banner: 'https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=1200&h=400&fit=crop',
        server_icon: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=200&h=200&fit=crop'
    },
    {
        name: 'Zona Fitness',
        normalized_name: 'zona-fitness',
        short_description: 'Motivación y vida saludable',
        full_description: 'Comparte tus rutinas de ejercicio, logros fitness y consejos de nutrición. Un espacio de apoyo mutuo para alcanzar tus metas de salud y bienestar.',
        server_banner: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1200&h=400&fit=crop',
        server_icon: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=200&h=200&fit=crop'
    },
    {
        name: 'Plaza General',
        normalized_name: 'plaza-general',
        short_description: 'Conversaciones sobre todo',
        full_description: 'El punto de encuentro principal para charlas sobre cualquier tema. Noticias, memes, preguntas random, debates amistosos - si no sabes dónde publicar, este es tu lugar.',
        server_banner: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1200&h=400&fit=crop',
        server_icon: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=200&h=200&fit=crop'
    },
    {
        name: 'Tech Talk',
        normalized_name: 'tech-talk',
        short_description: 'Tecnología y programación',
        full_description: 'Discute sobre las últimas tendencias en tecnología, comparte proyectos de código, pide ayuda con bugs y debate sobre los mejores lenguajes de programación.',
        server_banner: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&h=400&fit=crop',
        server_icon: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=200&h=200&fit=crop'
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

    // Seed de salas por defecto
    console.log('🏠 Creando salas por defecto...');
    for (const room of defaultRooms) {
        await prisma.room.upsert({
            where: { normalized_name: room.normalized_name },
            update: {
                verified: true,
                name: room.name,
                short_description: room.short_description,
                full_description: room.full_description,
                server_banner: room.server_banner,
                server_icon: room.server_icon,
            },
            create: room,
        });
    }
    console.log(`✅ ${defaultRooms.length} salas creadas\n`);

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