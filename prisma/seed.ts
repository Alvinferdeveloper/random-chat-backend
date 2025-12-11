import prisma from '../src/lib/prisma';

const hobbies = [
    'Música', 'Fotografía', 'Lectura', 'Videojuegos',
    'Arte', 'Viajes', 'Café', 'Fitness'
];

async function main() {
    for (const name of hobbies) {
        await prisma.hobby.upsert({
            where: { name },
            update: {},
            create: { name },
        });
    }
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });