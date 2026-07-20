#!/usr/bin/env python3
"""
Netsis TCP proxy — Docker konteynerlerinin SSH ters tüneline erişmesi için.

Akış:
  Fabrika PC --ssh -R--> sunucu 127.0.0.1:17070 --bu proxy--> 172.18.0.1:17071
                                                               ^ konteynerler buraya bağlanır

Konteynerler 127.0.0.1'e (host loopback) erişemediği için bu köprü gerekli.
systemd tarafından yönetilir: netsis-proxy.service
"""
import socket
import select
import threading
import sys
import logging

LISTEN_HOST = '172.18.0.1'   # Docker bridge gateway — konteynerlerin gördüğü adres
LISTEN_PORT = 17071
TARGET_HOST = '127.0.0.1'    # SSH ters tünelinin açtığı port
TARGET_PORT = 17070

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s %(levelname)s %(message)s',
    stream=sys.stdout,
)
log = logging.getLogger('netsis-proxy')


def pump(src, dst):
    """İki soket arasında veri aktarır, biri kapanınca ikisini de kapatır."""
    try:
        while True:
            r, _, _ = select.select([src, dst], [], [], 30)
            if not r:
                continue
            if src in r:
                data = src.recv(8192)
                if not data:
                    break
                dst.sendall(data)
            if dst in r:
                data = dst.recv(8192)
                if not data:
                    break
                src.sendall(data)
    except OSError:
        pass
    finally:
        for s in (src, dst):
            try:
                s.close()
            except OSError:
                pass


def handle(client, addr):
    backend = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    backend.settimeout(10)
    try:
        backend.connect((TARGET_HOST, TARGET_PORT))
        backend.settimeout(None)
    except OSError as e:
        # Tünel kapalıysa buraya düşer — konteyner ECONNREFUSED görür.
        log.warning('Tünele bağlanılamadı (%s:%s): %s', TARGET_HOST, TARGET_PORT, e)
        try:
            client.close()
        except OSError:
            pass
        return
    pump(client, backend)


def main():
    srv = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    srv.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    srv.bind((LISTEN_HOST, LISTEN_PORT))
    srv.listen(50)
    log.info('Proxy dinliyor: %s:%s -> %s:%s',
             LISTEN_HOST, LISTEN_PORT, TARGET_HOST, TARGET_PORT)

    while True:
        try:
            client, addr = srv.accept()
        except OSError as e:
            log.error('accept hatası: %s', e)
            continue
        t = threading.Thread(target=handle, args=(client, addr), daemon=True)
        t.start()


if __name__ == '__main__':
    main()
