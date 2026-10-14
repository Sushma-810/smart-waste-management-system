pipeline {
    agent any

    environment {
        HARBOR_REGISTRY = '172.28.63.77:8081'
        HARBOR_PROJECT  = 'smart-waste-management'

        BACKEND_IMAGE   = "${HARBOR_REGISTRY}/${HARBOR_PROJECT}/swm-backend"
        FRONTEND_IMAGE  = "${HARBOR_REGISTRY}/${HARBOR_PROJECT}/swm-frontend"
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build Backend Docker Image') {
            steps {
                sh '''
                    echo "===== Building Smart Waste Backend ====="

                    docker build \
                    -f swm-backend/swm.Dockerfile \
                    -t swm-backend:latest \
                    ./swm-backend
                '''
            }
        }

        stage('Build Frontend Docker Image') {
            steps {
                sh '''
                    echo "===== Building Smart Waste Frontend ====="

                    docker build \
                    -f swm-frontend/swmfront.Dockerfile \
                    -t swm-frontend:latest \
                    ./swm-frontend
                '''
            }
        }

        stage('Show Docker Images') {
            steps {
                sh '''
                    echo "===== Smart Waste Docker Images ====="

                    docker images | grep swm-
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
                        echo "===== Deploying Smart Waste Backend ====="

                        docker rm -f swm-backend-container || true

                        docker run -d \
                        --name swm-backend-container \
                        --env-file "$ENV_FILE" \
                        -p 5000:5000 \
                        swm-backend:latest
                    '''
                }
            }
        }

        stage('Deploy Frontend') {
            steps {
                sh '''
                    echo "===== Deploying Smart Waste Frontend ====="

                    docker rm -f swm-frontend-container || true

                    docker run -d \
                    --name swm-frontend-container \
                    -p 5173:80 \
                    swm-frontend:latest
                '''
            }
        }

        stage('Check Containers') {
            steps {
                sh '''
                    echo "===== Smart Waste Running Containers ====="

                    docker ps --format "table {{.Names}}\\t{{.Image}}\\t{{.Status}}\\t{{.Ports}}"
                '''
            }
        }

        stage('Health Check') {
            steps {
                sh '''
                    echo "===== Backend Health Check ====="

                    sleep 3

                    docker exec swm-backend-container \
                    node -e "
                        fetch('http://localhost:5000')
                        .then(r => {
                            console.log('Backend HTTP Status:', r.status);

                            if (r.status >= 200 && r.status < 500) {
                                console.log('Backend application is responding!');
                                process.exit(0);
                            } else {
                                console.log('Backend health check failed!');
                                process.exit(1);
                            }
                        })
                        .catch(e => {
                            console.error('Backend connection failed:', e);
                            process.exit(1);
                        })
                    "

                    echo "Backend is responding successfully!"

                    echo "===== Frontend Health Check ====="

                    docker exec swm-frontend-container \
                    wget -qO- http://localhost > /dev/null

                    echo "Frontend is responding successfully!"
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
                        echo "===== Login to Smart Waste Harbor Registry ====="

                        echo "$HARBOR_PASSWORD" | docker login \
                        "$HARBOR_REGISTRY" \
                        -u "$HARBOR_USER" \
                        --password-stdin
                    '''
                }
            }
        }

        stage('Tag Images for Harbor') {
            steps {
                sh '''
                    echo "===== Tagging Smart Waste Images ====="

                    docker tag swm-backend:latest \
                    "$BACKEND_IMAGE:build-${BUILD_NUMBER}"

                    docker tag swm-backend:latest \
                    "$BACKEND_IMAGE:latest"

                    docker tag swm-frontend:latest \
                    "$FRONTEND_IMAGE:build-${BUILD_NUMBER}"

                    docker tag swm-frontend:latest \
                    "$FRONTEND_IMAGE:latest"

                    echo "===== Harbor Tags Created ====="

                    docker images | grep smart-waste-management
                '''
            }
        }

        stage('Push Images to Harbor') {
            steps {
                sh '''
                    echo "===== Pushing Smart Waste Backend ====="

                    docker push "$BACKEND_IMAGE:build-${BUILD_NUMBER}"
                    docker push "$BACKEND_IMAGE:latest"

                    echo "===== Pushing Smart Waste Frontend ====="

                    docker push "$FRONTEND_IMAGE:build-${BUILD_NUMBER}"
                    docker push "$FRONTEND_IMAGE:latest"

                    echo "===== Smart Waste Images Pushed Successfully ====="
                '''
            }
        }

        stage('Logout from Harbor') {
            steps {
                sh '''
                    docker logout "$HARBOR_REGISTRY" || true
                '''
            }
        }
    }

    post {
        success {
            echo '=============================================='
            echo 'SMART WASTE MANAGEMENT CI/CD SUCCESS'
            echo '=============================================='
            echo 'Docker images built successfully.'
            echo 'Containers deployed successfully.'
            echo 'Images pushed to Harbor successfully.'
        }

        failure {
            echo '=============================================='
            echo 'SMART WASTE MANAGEMENT CI/CD FAILED'
            echo '=============================================='
        }
    }
}
