pipeline {
    agent any

    environment {
        HARBOR_REGISTRY = '172.28.63.77:8081'
        HARBOR_PROJECT  = 'smart-waste-management'

        BACKEND_IMAGE   = "${HARBOR_REGISTRY}/${HARBOR_PROJECT}/swm-backend"
        FRONTEND_IMAGE  = "${HARBOR_REGISTRY}/${HARBOR_PROJECT}/swm-frontend"

        BACKEND_LOCAL_IMAGE  = 'swm-backend:latest'
        FRONTEND_LOCAL_IMAGE = 'swm-frontend:latest'

        BACKEND_CONTAINER  = 'swm-backend-container'
        FRONTEND_CONTAINER = 'swm-frontend-container'

        SWM_NETWORK = 'swm'
    }

    stages {

        stage('Check Environment') {
            steps {
                sh '''
                    echo "=============================================="
                    echo "Checking Jenkins Environment"
                    echo "=============================================="

                    whoami
                    java -version
                    git --version
                    docker --version
                    node --version || true
                    npm --version || true

                    docker info > /dev/null

                    echo "Environment check completed successfully."
                '''
            }
        }

        stage('Checkout') {
            steps {
                echo '===== Checking Out Smart Waste Management Source Code ====='

                checkout scm

                sh '''
                    echo "=============================================="
                    echo "Source Code Structure"
                    echo "=============================================="

                    ls -la

                    echo ""
                    echo "Backend:"
                    ls -la swm-backend

                    echo ""
                    echo "Frontend:"
                    ls -la swm-frontend
                '''
            }
        }

        stage('Install Backend Dependencies') {
            steps {
                sh '''
                    echo "=============================================="
                    echo "Installing Backend Dependencies"
                    echo "=============================================="

                    cd swm-backend
                    npm install

                    echo "Backend dependencies installed successfully."
                '''
            }
        }

        stage('Install Frontend Dependencies') {
            steps {
                sh '''
                    echo "=============================================="
                    echo "Installing Frontend Dependencies"
                    echo "=============================================="

                    cd swm-frontend
                    npm install

                    echo "Frontend dependencies installed successfully."
                '''
            }
        }

        stage('Cleanup Old Containers') {
            steps {
                sh '''
                    echo "=============================================="
                    echo "Removing Old Smart Waste Containers"
                    echo "=============================================="

                    docker rm -f ${BACKEND_CONTAINER} || true
                    docker rm -f ${FRONTEND_CONTAINER} || true

                    echo "Old containers removed successfully."
                '''
            }
        }

        stage('Cleanup Old Images') {
            steps {
                sh '''
                    echo "=============================================="
                    echo "Removing Old Smart Waste Images"
                    echo "=============================================="

                    docker rmi ${BACKEND_LOCAL_IMAGE} || true
                    docker rmi ${FRONTEND_LOCAL_IMAGE} || true

                    echo "Old images removed successfully."
                '''
            }
        }

        stage('Build Backend Docker Image') {
            steps {
                sh '''
                    echo "=============================================="
                    echo "Building Smart Waste Backend Docker Image"
                    echo "=============================================="

                    docker build \
                        -f swm-backend/swm.Dockerfile \
                        -t ${BACKEND_LOCAL_IMAGE} \
                        ./swm-backend

                    echo "Backend Docker image built successfully."
                '''
            }
        }

        stage('Build Frontend Docker Image') {
            steps {
                sh '''
                    echo "=============================================="
                    echo "Building Smart Waste Frontend Docker Image"
                    echo "=============================================="

                    docker build \
                        -f swm-frontend/swmfront.Dockerfile \
                        -t ${FRONTEND_LOCAL_IMAGE} \
                        ./swm-frontend

                    echo "Frontend Docker image built successfully."
                '''
            }
        }

        stage('Show Docker Images') {
            steps {
                sh '''
                    echo "=============================================="
                    echo "Smart Waste Docker Images"
                    echo "=============================================="

                    docker images | grep -E "swm-backend|swm-frontend" || true
                '''
            }
        }

        stage('Prepare SWM Network') {
            steps {
                sh '''
                    echo "=============================================="
                    echo "Preparing SWM Docker Network"
                    echo "=============================================="

                    docker network inspect ${SWM_NETWORK} >/dev/null 2>&1 || \
                    docker network create ${SWM_NETWORK}

                    echo "SWM Docker network is ready."
                '''
            }
        }

        stage('Deploy Backend') {
            steps {

                withCredentials([
                    file(
                        credentialsId: 'swm-backend-env',
                        variable: 'ENV_FILE'
                    )
                ]) {

                    sh '''
                        echo "=============================================="
                        echo "Deploying Smart Waste Backend"
                        echo "=============================================="

                        docker rm -f ${BACKEND_CONTAINER} || true

                        docker run -d \
                            --name ${BACKEND_CONTAINER} \
                            --network ${SWM_NETWORK} \
                            --env-file "$ENV_FILE" \
                            -v ~/.aws:/root/.aws:ro \
                            -p 5000:5000 \
                            ${BACKEND_LOCAL_IMAGE}

                        echo "Backend container started successfully."

                        sleep 5

                        docker logs --tail 30 ${BACKEND_CONTAINER}
                    '''
                }
            }
        }

        stage('Backend Health Check') {
            steps {
                sh '''
                    echo "=============================================="
                    echo "Backend Health Check"
                    echo "=============================================="

                    sleep 3

                    docker exec ${BACKEND_CONTAINER} node -e "
                        fetch('http://localhost:5000/api/health')
                        .then(async r => {
                            const text = await r.text();

                            console.log('Backend HTTP Status:', r.status);
                            console.log('Backend Response:', text);

                            if (r.status >= 200 && r.status < 300) {
                                console.log('Backend API is healthy!');
                                process.exit(0);
                            } else {
                                console.error('Backend health check failed!');
                                process.exit(1);
                            }
                        })
                        .catch(e => {
                            console.error('Backend connection failed:', e);
                            process.exit(1);
                        });
                    "

                    echo "Backend health check passed."
                '''
            }
        }

        stage('Deploy Frontend') {
            steps {
                sh '''
                    echo "=============================================="
                    echo "Deploying Smart Waste Frontend"
                    echo "=============================================="

                    docker rm -f ${FRONTEND_CONTAINER} || true

                    docker run -d \
                        --name ${FRONTEND_CONTAINER} \
                        --network ${SWM_NETWORK} \
                        -p 5443:5443 \
                        ${FRONTEND_LOCAL_IMAGE}

                    echo "Frontend container started."

                    sleep 10

                    docker logs --tail 30 ${FRONTEND_CONTAINER}
                '''
            }
        }

        stage('Frontend Health Check') {
            steps {
                sh '''
                    echo "=============================================="
                    echo "Frontend Health Check"
                    echo "=============================================="

                    docker exec ${FRONTEND_CONTAINER} node -e "
                        fetch('http://localhost:5443/swm/')
                        .then(async r => {
                            console.log('Frontend HTTP Status:', r.status);

                            if (r.status >= 200 && r.status < 500) {
                                console.log('Frontend application is responding!');
                                process.exit(0);
                            } else {
                                console.error('Frontend health check failed!');
                                process.exit(1);
                            }
                        })
                        .catch(e => {
                            console.error('Frontend connection failed:', e);
                            process.exit(1);
                        });
                    "

                    echo "Frontend health check passed."
                '''
            }
        }

        stage('Check Containers') {
            steps {
                sh '''
                    echo "=============================================="
                    echo "Smart Waste Running Containers"
                    echo "=============================================="

                    docker ps \
                        --format "table {{.Names}}\\t{{.Image}}\\t{{.Status}}\\t{{.Ports}}"
                '''
            }
        }

        stage('Test Statistics API') {
            steps {
                sh '''
                    echo "=============================================="
                    echo "Testing Statistics API"
                    echo "=============================================="

                    curl -f http://localhost:5000/api/stats

                    echo ""
                    echo "Statistics API is working."
                '''
            }
        }

        stage('Login to Harbor') {
            steps {

                withCredentials([
                    usernamePassword(
                        credentialsId: 'harbor-credentials',
                        usernameVariable: 'HARBOR_USER',
                        passwordVariable: 'HARBOR_PASSWORD'
                    )
                ]) {

                    sh '''
                        echo "=============================================="
                        echo "Login to Harbor Registry"
                        echo "=============================================="

                        echo "$HARBOR_PASSWORD" | docker login \
                            "$HARBOR_REGISTRY" \
                            -u "$HARBOR_USER" \
                            --password-stdin

                        echo "Successfully logged in to Harbor."
                    '''
                }
            }
        }

        stage('Tag Images for Harbor') {
            steps {
                sh '''
                    echo "=============================================="
                    echo "Creating Harbor Image Tags"
                    echo "=============================================="

                    docker tag \
                        ${BACKEND_LOCAL_IMAGE} \
                        "$BACKEND_IMAGE:build-${BUILD_NUMBER}"

                    docker tag \
                        ${BACKEND_LOCAL_IMAGE} \
                        "$BACKEND_IMAGE:latest"

                    docker tag \
                        ${FRONTEND_LOCAL_IMAGE} \
                        "$FRONTEND_IMAGE:build-${BUILD_NUMBER}"

                    docker tag \
                        ${FRONTEND_LOCAL_IMAGE} \
                        "$FRONTEND_IMAGE:latest"

                    echo "Harbor tags created successfully."

                    docker images | grep smart-waste-management || true
                '''
            }
        }

        stage('Push Images to Harbor') {
            steps {
                sh '''
                    echo "=============================================="
                    echo "Pushing Backend Image to Harbor"
                    echo "=============================================="

                    docker push \
                        "$BACKEND_IMAGE:build-${BUILD_NUMBER}"

                    docker push \
                        "$BACKEND_IMAGE:latest"

                    echo "=============================================="
                    echo "Pushing Frontend Image to Harbor"
                    echo "=============================================="

                    docker push \
                        "$FRONTEND_IMAGE:build-${BUILD_NUMBER}"

                    docker push \
                        "$FRONTEND_IMAGE:latest"

                    echo "All images pushed successfully."
                '''
            }
        }

        stage('Logout from Harbor') {
            steps {
                sh '''
                    echo "=============================================="
                    echo "Logging Out From Harbor"
                    echo "=============================================="

                    docker logout "$HARBOR_REGISTRY" || true

                    echo "Harbor logout completed."
                '''
            }
        }
    }

    post {

        success {
            echo '''
==============================================
SMART WASTE MANAGEMENT CI/CD SUCCESS
==============================================

Environment Check         : SUCCESS
Source Code Checkout      : SUCCESS
Backend Dependencies      : SUCCESS
Frontend Dependencies     : SUCCESS
Old Containers Cleanup    : SUCCESS
Old Images Cleanup        : SUCCESS
Backend Image Build       : SUCCESS
Frontend Image Build      : SUCCESS
SWM Network               : SUCCESS
Backend Deployment        : SUCCESS
Backend Health Check      : SUCCESS
Frontend Deployment       : SUCCESS
Frontend Health Check     : SUCCESS
Statistics API            : SUCCESS
Harbor Login              : SUCCESS
Images Tagged             : SUCCESS
Images Pushed             : SUCCESS
Harbor Logout             : SUCCESS

Smart Waste Management CI/CD
completed successfully.

==============================================
'''
        }

        failure {
            echo '''
==============================================
SMART WASTE MANAGEMENT CI/CD FAILED
==============================================

Please check the Jenkins console output
for the failed stage.

==============================================
'''

            sh '''
                echo "=============================================="
                echo "Docker Containers After Failure"
                echo "=============================================="

                docker ps -a

                echo ""
                echo "Backend Logs:"
                docker logs ${BACKEND_CONTAINER} 2>/dev/null || true

                echo ""
                echo "Frontend Logs:"
                docker logs ${FRONTEND_CONTAINER} 2>/dev/null || true
            '''
        }

        always {
            echo "=============================================="
            echo "Jenkins Pipeline Execution Completed"
            echo "=============================================="
        }
    }
}
