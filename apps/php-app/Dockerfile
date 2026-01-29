# Use the official PHP 8 image with Apache
FROM php:8-apache

# Install only the essential package (OpenSSL for generating SSL certificates)
RUN apt-get update && apt-get install -y --no-install-recommends \
    openssl \
    curl \
    rsync \
 && apt-get clean && rm -rf /var/lib/apt/lists/*

# Enable required Apache modules:
# - rewrite: for URL rewriting (e.g., .htaccess)
# - ssl: for HTTPS support
RUN a2enmod rewrite ssl

# Configure Apache:
# - Set the ServerName to suppress warnings
# - Allow .htaccess overrides inside the default web root
RUN echo "ServerName localhost" >> /etc/apache2/apache2.conf && \
    sed -i '/<Directory \/var\/www\/>/,/<\/Directory>/ s/AllowOverride None/AllowOverride All/' /etc/apache2/apache2.conf

# Generate a self-signed SSL certificate for HTTPS
# - Valid for 365 days
# - CN = localhost
RUN mkdir -p /etc/ssl/private && \
    openssl req -x509 -nodes -days 365 \
      -newkey rsa:2048 \
      -keyout /etc/ssl/private/server.key \
      -out /etc/ssl/certs/server.crt \
  -subj "/C=US/ST=Local/L=Local/O=Dev/CN=localhost"

# Create Apache SSL virtual host configuration
# - Uses the self-signed cert
# - Enables HTTPS on port 443
# - Applies .htaccess rules inside /var/www/html
RUN tee /etc/apache2/sites-available/default-ssl.conf > /dev/null <<'EOF'
<IfModule mod_ssl.c>
  <VirtualHost _default_:443>
    ServerAdmin webmaster@localhost
    DocumentRoot /var/www/html

    ServerName localhost

    SSLEngine on
    SSLCertificateFile /etc/ssl/certs/server.crt
    SSLCertificateKeyFile /etc/ssl/private/server.key

    <Directory /var/www/html>
        Options Indexes FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>
  </VirtualHost>
</IfModule>
EOF

# Enable the SSL virtual host configuration
RUN a2ensite default-ssl

# Copy application files (excluding setup-app.marker)
COPY src/ /var/www/html/

# Copy container initialization scripts
RUN mkdir -p /opt/container-init
COPY container-init/ /opt/container-init/
COPY custom-entrypoint.sh /opt/custom-entrypoint.sh
RUN chmod +x /opt/custom-entrypoint.sh /opt/container-init/*.sh

# Set working directory
WORKDIR /var/www/html

# Expose ports:
# - 80 for HTTP
# - 443 for HTTPS
EXPOSE 80 443

# Use custom entrypoint
ENTRYPOINT ["/opt/custom-entrypoint.sh"]
