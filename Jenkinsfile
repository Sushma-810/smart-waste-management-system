pipeline {

    agent any

    environment {

        // ==============================
        // Harbor Configuration
        // ==============================

        HARBOR_REGISTRY = '172.28.63.77:8081'
        HARBOR_PROJECT  = 'smart-waste-management'

        BACKEND_IMAGE  = "${HARBOR_REGISTRY}/${HARBOR_PROJECT}/swm-backend"
        FRONTEND_IMAGE = "${HARBOR_REGISTRY}/${HARBOR_PROJECT}/swm-frontend"

        // ==============================
        // Local Docker Images
        // ==============================

        BACKEND_LOCAL_IMAGE  = 'swm-backend:latest'
        FRONTEND_LOCAL_IMAGE = 'swm-frontend:latest'

        // ==============================
        // Container Names
        // ==============================

        BACKEND_CONTAINER  = 'swm-backend-container'
        FRONTEND_CONTAINER = 'swm-frontend-container'

        // ==============================
        // Docker Network
        // ==============================

        SWM_NETWORK = 'swm'
    }


    stages {

        // =========================================================
        // 1. CHECK JENKINS ENVIRONMENT
        // =========================================================

        stage('Check Environment') {

            steps {

                sh '''
                    echo "=============================================="
                    echo "Checking Jenkins Environment"
                    echo "=============================================="

                    echo "Jenkins User:"
                    whoami

                    echo ""
                    echo "Java:"
                    java -version

                    echo ""
                    echo "Git:"
                    git --version

                    echo ""
                    echo "Docker:"
                    docker --version

                    echo ""
                    echo "Docker Info:"
                    docker info

                    echo ""
                    echo "Environment check completed."
                '''
            }
        }


        // =========================================================
        // 2. CHECKOUT SOURCE CODE
        // =========================================================

        stage('Checkout') {

            steps {

                echo "=============================================="
                echo "Checking Out Smart Waste Management Source Code"
                echo "=============================================="

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


        // =========================================================
        // 3. CLEAN OLD BACKEND CONTAINER
        // =========================================================

        stage('Cleanup Old Containers') {

            steps {

                sh '''
                    echo "=============================================="
                    echo "Cleaning Old Containers"
                    echo "=============================================="

                    docker rm -f ${BACKEND_CONTAINER} || true
                    docker rm -f ${FRONTEND_CONTAINER} || true

                    echo ""
                    echo "Old containers cleaned."
                '''
            }
        }


        // =========================================================
        // 4. CLEAN OLD IMAGES
        // =========================================================

        stage('Cleanup Old Images') {

            steps {

                sh '''
                    echo "=============================================="
                    echo "Cleaning Old Docker Images"
                    echo "=============================================="

                    docker rmi ${BACKEND_LOCAL_IMAGE} || true
                    docker rmi ${FRONTEND_LOCAL_IMAGE} || true

                    echo ""
                    echo "Old images cleaned."
                '''
            }
        }


        // =========================================================
        // 5. BUILD BACKEND IMAGE
        // =========================================================

        stage('Build Backend Docker Image') {

            steps {

                sh '''
                    echo "=============================================="
                    echo "Building Backend Docker Image"
                    echo "=============================================="

                    docker build \
                        -f swm-backend/swm.Dockerfile \
                        -t ${BACKEND_LOCAL_IMAGE} \
                        ./swm-backend

                    echo ""
                    echo "Backend image built successfully."
                '''
            }
        }


        // =========================================================
        // 6. BUILD FRONTEND IMAGE
        // =========================================================

        stage('Build Frontend Docker Image') {

            steps {

                sh '''
                    echo "=============================================="
                    echo "Building Frontend Docker Image"
                    echo "=============================================="

                    docker build \
                        -f swm-frontend/swmfront.Dockerfile \
                        -t ${FRONTEND_LOCAL_IMAGE} \
                        ./swm-frontend

                    echo ""
                    echo "Frontend image built successfully."
                '''
            }
        }


        // =========================================================
        // 7. SHOW DOCKER IMAGES
        // =========================================================

        stage('Show Docker Images') {

            steps {

                sh '''
                    echo "=============================================="
                    echo "Docker Images"
                    echo "=============================================="

                    docker images | grep -E "swm-backend|swm-frontend" || true
                '''
            }
        }


        // =========================================================
        // 8. CREATE / CHECK SWM NETWORK
        // =========================================================

        stage('Prepare SWM Network') {

            steps {

                sh '''
                    echo "=============================================="
                    echo "Preparing Docker Network"
                    echo "=============================================="

                    docker network inspect ${SWM_NETWORK} >/dev/null 2>&1 || \
                    docker network create ${SWM_NETWORK}

                    echo ""
                    echo "Docker network:"
                    docker network inspect ${SWM_NETWORK} --format '{{.Name}}'
                '''
            }
        }


        // =========================================================
        // 9. DEPLOY BACKEND
        // =========================================================

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
                        echo "Deploying Backend Container"
                        echo "=============================================="

                        docker run -d \
                            --name ${BACKEND_CONTAINER} \
                            --network ${SWM_NETWORK} \
                            --env-file "$ENV_FILE" \
                            -v ~/.aws:/root/.aws:ro \
                            -p 5000:5000 \
                            ${BACKEND_LOCAL_IMAGE}

                        echo ""
                        echo "Backend container started."

                        sleep 5

                        echo ""
                        echo "Backend Logs:"
                        docker logs ${BACKEND_CONTAINER} --tail 50
                    '''
                }
            }
        }


        // =========================================================
        // 10. BACKEND HEALTH CHECK
        // =========================================================

        stage('Backend Health Check') {

            steps {

                sh '''
                    echo "=============================================="
                    echo "Backend Health Check"
                    echo "=============================================="

                    docker exec ${BACKEND_CONTAINER} node -e "
                        fetch('http://localhost:5000/api/health')
                          .then(async r => {
                            const text = await r.text();
                            console.log('HTTP Status:', r.status);
                            console.log('Response:', text);
                            if (!r.ok) process.exit(1);
                          })
                          .catch(err => {
                            console.error(err);
                            process.exit(1);
                          });
                    "

                    echo ""
                    echo "Backend health check passed."
                '''
            }
        }


        // =========================================================
        // 11. DEPLOY FRONTEND
        // =========================================================

        stage('Deploy Frontend') {

            steps {

                sh '''
                    echo "=============================================="
                    echo "Deploying Frontend Container"
                    echo "=============================================="

                    docker run -d \
                        --name ${FRONTEND_CONTAINER} \
                        --network ${SWM_NETWORK} \
                        -p 5443:5443 \
                        ${FRONTEND_LOCAL_IMAGE}

                    echo ""
                    echo "Frontend container started."

                    sleep 5

                    echo ""
                    echo "Frontend Logs:"
                    docker logs ${FRONTEND_CONTAINER} --tail 50
                '''
            }
        }


        // =========================================================
        // 12. FRONTEND HEALTH CHECK
        // =========================================================

        stage('Frontend Health Check') {

            steps {

                sh '''
                    echo "=============================================="
                    echo "Frontend Health Check"
                    echo "=============================================="

                    docker exec ${FRONTEND_CONTAINER} node -e "
                        fetch('http://localhost:5443/swm/')
                          .then(async r => {
                            console.log('HTTP Status:', r.status);
                            if (!r.ok) process.exit(1);
                          })
                          .catch(err => {
                            console.error(err);
                            process.exit(1);
                          });
                    "

                    echo ""
                    echo "Frontend health check passed."
                '''
            }
        }


        // =========================================================
        // 13. CHECK RUNNING CONTAINERS
        // =========================================================

        stage('Check Containers') {

            steps {

                sh '''
                    echo "=============================================="
                    echo "Running Containers"
                    echo "=============================================="

                    docker ps -a
                '''
            }
        }


        // =========================================================
        // 14. TEST STATISTICS API
        // =========================================================

        stage('Test Statistics API') {

            steps {

                sh '''
                    echo "=============================================="
                    echo "Testing Statistics API"
                    echo "=============================================="

                    curl -f http://localhost:5000/api/stats

                    echo ""
                    echo ""
                    echo "Statistics API test passed."
                '''
            }
        }


        // =========================================================
        // 15. LOGIN TO HARBOR
        // =========================================================

        stage('Login to Harbor') {

            steps {

                withCredentials([
                    usernamePassword(
                        credentialsId: 'harbor-credentials',
                        usernameVariable: 'HARBOR_USERNAME',
                        passwordVariable: 'HARBOR_PASSWORD'
                    )
                ]) {

                    sh '''
                        echo "=============================================="
                        echo "Logging Into Harbor"
                        echo "=============================================="

                        echo "$HARBOR_PASSWORD" | docker login \
                            ${HARBOR_REGISTRY} \
                            -u "$HARBOR_USERNAME" \
                            --password-stdin

                        echo ""
                        echo "Harbor login successful."
                    '''
                }
            }
        }


        // =========================================================
        // 16. TAG IMAGES FOR HARBOR
        // =========================================================

        stage('Tag Images for Harbor') {

            steps {

                sh '''
                    echo "=============================================="
                    echo "Tagging Images for Harbor"
                    echo "=============================================="

                    echo "Backend build tag:"
                    docker tag \
                        ${BACKEND_LOCAL_IMAGE} \
                        ${BACKEND_IMAGE}:build-${BUILD_NUMBER}

                    echo "Backend latest tag:"
                    docker tag \
                        ${BACKEND_LOCAL_IMAGE} \
                        ${BACKEND_IMAGE}:latest


                    echo ""
                    echo "Frontend build tag:"
                    docker tag \
                        ${FRONTEND_LOCAL_IMAGE} \
                        ${FRONTEND_IMAGE}:build-${BUILD_NUMBER}

                    echo "Frontend latest tag:"
                    docker tag \
                        ${FRONTEND_LOCAL_IMAGE} \
                        ${FRONTEND_IMAGE}:latest


                    echo ""
                    echo "Images tagged successfully."

                    docker images | grep "${HARBOR_PROJECT}"
                '''
            }
        }


        // =========================================================
        // 17. PUSH IMAGES TO HARBOR
        // =========================================================

        stage('Push Images to Harbor') {

            steps {

                sh '''
                    echo "=============================================="
                    echo "Pushing Images to Harbor"
                    echo "=============================================="

                    echo "Pushing Backend build image..."
                    docker push ${BACKEND_IMAGE}:build-${BUILD_NUMBER}

                    echo ""
                    echo "Pushing Backend latest image..."
                    docker push ${BACKEND_IMAGE}:latest


                    echo ""
                    echo "Pushing Frontend build image..."
                    docker push ${FRONTEND_IMAGE}:build-${BUILD_NUMBER}

                    echo ""
                    echo "Pushing Frontend latest image..."
                    docker push ${FRONTEND_IMAGE}:latest


                    echo ""
                    echo "=============================================="
                    echo "Harbor Push Completed"
                    echo "=============================================="
                '''
            }
        }


        // =========================================================
        // 18. LOGOUT FROM HARBOR
        // =========================================================

        stage('Logout from Harbor') {

            steps {

                sh '''
                    echo "=============================================="
                    echo "Logging Out From Harbor"
                    echo "=============================================="

                    docker logout ${HARBOR_REGISTRY}

                    echo ""
                    echo "Harbor logout completed."
                '''
            }
        }
    }


    // =============================================================
    // POST ACTIONS
    // =============================================================

    post {

        success {

            echo '''
==============================================
SMART WASTE MANAGEMENT CI/CD SUCCESS
==============================================

Pipeline completed successfully.

Backend:
  Container: swm-backend-container
  Port: 5000

Frontend:
  Container: swm-frontend-container
  Port: 5443

Harbor:
  Registry: 172.28.63.77:8081
  Project: smart-waste-management

Docker images were successfully pushed to Harbor.

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
                echo "=============================================="
                echo "Backend Logs"
                echo "=============================================="

                docker logs ${BACKEND_CONTAINER} 2>&1 || true

                echo ""
                echo "=============================================="
                echo "Frontend Logs"
                echo "=============================================="

                docker logs ${FRONTEND_CONTAINER} 2>&1 || true
            '''
        }


        always {

            echo '''
==============================================
Jenkins Pipeline Execution Completed
==============================================
'''
        }
    }
}
