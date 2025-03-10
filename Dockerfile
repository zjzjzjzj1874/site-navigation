# 构建阶段
FROM golang:1.21-alpine AS builder

WORKDIR /app

# 设置 Go 模块代理和Alpine镜像源
ENV GOPROXY=https://goproxy.cn,direct

# 复制依赖文件
COPY go.mod go.sum ./

# 下载依赖
RUN go mod download

# 复制源代码
COPY . .

# 构建应用
RUN CGO_ENABLED=0 go build -o main .

# 运行阶段
FROM alpine:latest

WORKDIR /app

# 安装基础依赖
RUN sed -i "s/dl-cdn.alpinelinux.org/mirrors.aliyun.com/g" /etc/apk/repositories
RUN apk --update --no-cache add ca-certificates

# 从构建阶段复制二进制文件和必要的资源文件
COPY --from=builder /app/main .
COPY --from=builder /app/templates ./templates
COPY --from=builder /app/static ./static
COPY --from=builder /app/sites.json .
COPY --from=builder /app/module_types.json .

EXPOSE 44399

CMD ["./main"]