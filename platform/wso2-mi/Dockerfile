# -------- Build Arguments --------
ARG MI_VERSION=4.4.0

# Use the official WSO2 Micro Integrator 4.4.0 base image 
FROM wso2/wso2mi:${MI_VERSION:-4.4.0}

# deployment.toml (from mi-conf/conf)
COPY --chown=wso2carbon:wso2 ./mi-conf/conf/deployment.toml ${WSO2_SERVER_HOME}/conf/deployment.toml

# Copy deployment/server/carbonapps directory and contents recursively
COPY --chown=wso2carbon:wso2 ./mi-conf/repository/deployment/server/carbonapps ${WSO2_SERVER_HOME}/repository/deployment/server/carbonapps

# Copy keystores
# COPY --chown=wso2carbon:wso2 certs/wso2carbon.jks ${WSO2_SERVER_HOME}/repository/resources/security/
# COPY --chown=wso2carbon:wso2 certs/client-truststore.jks ${WSO2_SERVER_HOME}/repository/resources/security/