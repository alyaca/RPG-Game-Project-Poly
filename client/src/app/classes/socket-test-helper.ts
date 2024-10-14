export class SocketTestHelper {
    connected = false;
    connect(): void {
        this.connected = true;
    }

    disconnect(): void {
        this.connected = false;
    }

    on(event: string, action: (data: any) => void): void {
        if (event === 'testEvent') {
            action({ test: 'data' });
        }
    }

    emit(event: string, data: any): void {
        return;
    }
}
