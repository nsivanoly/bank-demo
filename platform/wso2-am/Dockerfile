# -------- Build Arguments --------
ARG APIM_VERSION=4.5.0

# Use the official WSO2 API Manager 4.5.0
FROM wso2/wso2am:${APIM_VERSION:-4.5.0}

# Copy custom repository configurations (such as deployment.toml, synapse configs, etc.)
# into the server's repository directory with appropriate ownership
COPY --chown=wso2carbon:wso2 am-conf/repository/ ${WSO2_SERVER_HOME}/repository/

# Copy any additional runtime data, such as tenants, APIs, and other necessary files
COPY --chown=wso2carbon:wso2 am-data/ ${WSO2_SERVER_HOME}/am-data/

# Copy a custom entrypoint script that will be used to start the container
COPY --chown=wso2carbon:wso2 custom-entrypoint.sh /usr/local/bin/custom-entrypoint.sh

# Copy container-init folder that will be used to start the container
COPY --chown=wso2carbon:wso2 container-init/ /app/container-scripts

# Copy the API Controller (apictl) binary to be used inside the container (e.g., for automation or migration tasks)
COPY --chown=wso2carbon:wso2 am-data/apictl /usr/local/bin/apictl

# Make the entrypoint script and apictl executable
RUN chmod +x /usr/local/bin/apictl /usr/local/bin/custom-entrypoint.sh

# Set the custom entrypoint script as the container's entrypoint
ENTRYPOINT ["/usr/local/bin/custom-entrypoint.sh"]
