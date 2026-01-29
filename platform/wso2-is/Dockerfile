# -------- Build Arguments --------
ARG IS_VERSION=7.1.0

# Use the official WSO2 Identity Server 7.1.0.11 base image 
FROM wso2/wso2is:${IS_VERSION:-7.1.0}

COPY --chown=wso2carbon:wso2 is-conf/repository/ ${WSO2_SERVER_HOME}/repository/

# Copy custom entrypoint script
COPY --chown=wso2carbon:wso2 custom-entrypoint.sh /usr/local/bin/custom-entrypoint.sh

# Copy container-init scripts
COPY --chown=wso2carbon:wso2 container-init/ /app/container-scripts

# Make the entrypoint script and container scripts executable
RUN chmod +x /usr/local/bin/custom-entrypoint.sh && \
    if [ -d /app/container-scripts ]; then chmod +x /app/container-scripts/*.sh; fi

# Set the custom entrypoint script as the container's entrypoint
ENTRYPOINT ["/usr/local/bin/custom-entrypoint.sh"]

# # Copy config
# COPY --chown=wso2carbon:wso2 is-conf/repository/conf/deployment.toml ${WSO2_SERVER_HOME}/repository/conf/

# # Copy keystores
# COPY --chown=wso2carbon:wso2 is-conf/repository/resources/security/wso2carbon.jks ${WSO2_SERVER_HOME}/repository/resources/security/
# COPY --chown=wso2carbon:wso2 is-conf/repository/resources/security/client-truststore.jks ${WSO2_SERVER_HOME}/repository/resources/security/

# # Copy Userstores
# COPY --chown=wso2carbon:wso2 is-conf/repository/deployment/server/userstores/Active-Directory-Read-Only.xml ${WSO2_SERVER_HOME}/repository/deployment/server/userstores/
# COPY --chown=wso2carbon:wso2 is-conf/repository/deployment/server/userstores/Active-Directory-Read-Write.xml ${WSO2_SERVER_HOME}/repository/deployment/server/userstores/
# COPY --chown=wso2carbon:wso2 is-conf/repository/deployment/server/userstores/LDAP-Read-Only.xml ${WSO2_SERVER_HOME}/repository/deployment/server/userstores/
# COPY --chown=wso2carbon:wso2 is-conf/repository/deployment/server/userstores/LDAP-Read-Write.xml ${WSO2_SERVER_HOME}/repository/deployment/server/userstores/
# COPY --chown=wso2carbon:wso2 is-conf/repository/deployment/server/userstores/MySqlDB.xml ${WSO2_SERVER_HOME}/repository/deployment/server/userstores/

# # Copy database files
# COPY --chown=wso2carbon:wso2 is-conf/repository/database/*.mv.db ${WSO2_SERVER_HOME}/repository/database/