"""Run a command in a real POSIX PTY while proxying piped stdin/stdout.

GitHub Actions does not give steps an interactive controlling terminal. The
BSD `script(1)` shipped by macOS refuses that environment, so this tiny harness
creates the PTY directly and works consistently on both Linux and macOS.
"""

import errno
import fcntl
import os
import pty
import select
import struct
import sys
import termios


def main() -> int:
    command = sys.argv[1:]
    if not command:
        print("usage: pty-runner.py COMMAND [ARG ...]", file=sys.stderr)
        return 2

    child_pid, master_fd = pty.fork()
    if child_pid == 0:
        os.execv(command[0], command)

    # Give terminal-size-sensitive renderers deterministic, usable dimensions.
    fcntl.ioctl(
        master_fd,
        termios.TIOCSWINSZ,
        struct.pack("HHHH", 24, 80, 0, 0),
    )

    stdin_fd = sys.stdin.fileno()
    stdout_fd = sys.stdout.fileno()
    stdin_open = True

    try:
        while True:
            readable_fds = [master_fd]
            if stdin_open:
                readable_fds.append(stdin_fd)
            readable, _, _ = select.select(readable_fds, [], [])

            if master_fd in readable:
                try:
                    output = os.read(master_fd, 65_536)
                except OSError as error:
                    # Linux reports EIO when the PTY slave has closed.
                    if error.errno == errno.EIO:
                        break
                    raise
                if not output:
                    break
                os.write(stdout_fd, output)

            if stdin_open and stdin_fd in readable:
                input_data = os.read(stdin_fd, 65_536)
                if input_data:
                    os.write(master_fd, input_data)
                else:
                    stdin_open = False
    finally:
        os.close(master_fd)

    _, status = os.waitpid(child_pid, 0)
    return os.waitstatus_to_exitcode(status)


if __name__ == "__main__":
    raise SystemExit(main())
