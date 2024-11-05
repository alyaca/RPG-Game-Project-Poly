import { Server } from 'socket.io';

export const mockServer = {
    sockets: {
        sockets: new Map(),
        adapter: {
            rooms: new Map(),
        },
    },
    in: jest.fn().mockReturnValue({
        socketsLeave: jest.fn(),
    }),
    emit: jest.fn(),
    to: jest.fn().mockReturnThis(),
} as unknown as Server;
