FROM tcr.ap.toyota-asia.com/golden-image/ubi8/nodejs-18:latest AS builder

COPY ./ ./

USER 0

RUN npm config set -- strict-ssl=false
RUN npm install && \
    npm run build

FROM tcr.ap.toyota-asia.com/golden-image/ubi8/nodejs-18:latest

ENV DB_INSTANCE_CLIENT=/usr/lib/oracle/21/client64/lib

COPY --from=builder /opt/app-root/src/dist ./dist
COPY ./configs ./configs
COPY --from=builder /opt/app-root/src/package*.json ./
COPY .npmrc .npmrc

USER 0

RUN ln -sf /usr/share/zoneinfo/Asia/Bangkok /etc/localtime
RUN echo sslverify=false >> /etc/yum.conf
RUN yum install -y logrotate && \
    yum install -y https://download.oracle.com/otn_software/linux/instantclient/2111000/oracle-instantclient-basic-21.11.0.0.0-1.el8.x86_64.rpm

RUN mkdir -p /opt/app-root/src/logs && \
    chmod -R 775 /opt/app-root/src/logs && \
    echo '/opt/app-root/src/logs/*.log {' > /etc/logrotate.d/app && \
    echo '    daily' >> /etc/logrotate.d/app && \
    echo '    rotate 10' >> /etc/logrotate.d/app && \
    echo '    delaycompress' >> /etc/logrotate.d/app && \
    echo '    compress' >> /etc/logrotate.d/app && \
    echo '    notifempty' >> /etc/logrotate.d/app && \
    echo '    missingok' >> /etc/logrotate.d/app && \
    echo '    copytruncate' >> /etc/logrotate.d/app && \
    echo '}' >> /etc/logrotate.d/app

RUN npm install --omit=dev

# USER 1001
EXPOSE  3000

ENTRYPOINT ["npm", "start"]
