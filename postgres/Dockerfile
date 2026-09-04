FROM postgres:16

# Install build deps, clone and build pgvector
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
       build-essential \
       ca-certificates \
       git \
       postgresql-server-dev-16 \
       wget \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /tmp
RUN git clone --depth 1 https://github.com/pgvector/pgvector.git \
    && cd pgvector \
    && make \
    && make install \
    && rm -rf /tmp/pgvector

# Default Postgres image entrypoint will initialize DB; an init script will enable pgvector
