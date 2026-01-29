# -------- Build Arguments --------
ARG ICP_VERSION=1.0.0

# Use the official WSO2 Integration Control Plane 1.0.0 base image built on Rocky Linux
FROM wso2/wso2-integration-control-plane:${ICP_VERSION:-1.0.0}

# Copy keystores
# COPY --chown=wso2carbon:wso2 certs/wso2carbon.jks ${WSO2_SERVER_HOME}/repository/resources/security/
# COPY --chown=wso2carbon:wso2 certs/client-truststore.jks ${WSO2_SERVER_HOME}/repository/resources/security/