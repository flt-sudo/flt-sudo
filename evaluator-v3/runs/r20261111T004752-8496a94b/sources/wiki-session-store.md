# Session store (architecture wiki)
Last edited: 2021-06-02

Sessions are stored in a single Redis 5.0 node (`sess-redis-01`), no replicas, no persistence (RDB disabled). A node restart logs out all users. TODO: add replication.
