FROM tutum/apache-php:latest

COPY run.sh /
RUN chmod +x /run.sh
CMD ["/run.sh"]

RUN rm -r /app
COPY . /app

