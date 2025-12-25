FROM gcc:latest

WORKDIR /app

RUN useradd -m -s /bin/bash runner && \
    chown -R runner:runner /app && \
    chmod -R 755 /app

USER runner

COPY --chown=runner:runner . .

# Compile and run the C++ code at runtime
CMD ["sh", "-c", "g++ -o main main.cpp && ./main"]