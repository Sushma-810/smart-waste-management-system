pipeline {

    agent any

    options {
        skipDefaultCheckout(true)
        timestamps()
    }

    environment {

        // =========================================================
        // HARBOR
        // =========================================================
        HARBOR_REGISTRY = '172.28.63.77:8081'
        HARBOR_PROJECT  = 'smart-waste-management'

        BACKEND_IMAGE  = "${HARBOR_REGISTRY}/${HARBOR_PROJECT}/swm-backend"
        FRONTEND_IMAGE = "${HARBOR_REGISTRY}/${HARBOR_PROJECT}/swm-frontend"


        // =========================================================
        // LOCAL DOCKER IMAGES
        // =========================================================
        BACKEND_LOCAL_IMAGE  = 'swm-backend:latest'
        FRONTEND_LOCAL_IMAGE = 'swm-frontend:latest'


        // =========================================================
        // CONTAINER NAMES
        // =========================================================
        BACKEND_CONTAINER  = 'swm-backend-container'
        FRONTEND_CONTAINER = 'swm-frontend-container'


        // =========================================================
        // DOCKER NETWORK
        // =========================================================
        SWM_NETWORK = 'swm'
    }


    stages {

        // =========================================================
        // 1. CHECK ENVIRONMENT
        // =========================================================
        stage('Check Environment') {

            steps {

                sh '''
                    echo "=============================================="
                    echo "CHECKING JENKINS ENVIRONMENT"
                    echo "=============================================="

                    echo ""
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
        // 2. CHECKOUT
        // =========================================================
        stage('Checkout') {

            steps {

                echo "Checking out Smart Waste Management System..."

                checkout scm
            }
        }


        // =========================================================
        // 3. CLEAN OLD CONTAINERS
        // =========================================================
        stage('Cleanup Old Containers') {

            steps {

                sh '''
                    echo "=============================================="
                    echo "CLEANING OLD SWM CONTAINERS"
                    echo "=============================================="

                    docker rm -f ${BACKEND_CONTAINER} 2>/dev/null || true
                    docker rm -f ${FRONTEND_CONTAINER} 2>/dev/null || true

                    echo ""
                    echo "Old containers removed."
                '''
            }
        }


        // =========================================================
        // 4. CLEAN OLD LOCAL IMAGES
        // =========================================================
        stage('Cleanup Old Images') {

            steps {

                sh '''
                    echo "=============================================="
                    echo "CLEANING OLD SWM IMAGES"
                    echo "=============================================="

                    docker image rm ${BACKEND_LOCAL_IMAGE} 2>/dev/null || true
                    docker image rm ${FRONTEND_LOCAL_IMAGE} 2>/dev/null || true

                    echo ""
                    echo "Old images removed."
                '''
            }
        }


        // =========================================================
        // 5. BUILD BACKEND
        // =========================================================
        stage('Build Backend Docker Image') {

            steps {

                sh '''
                    echo "=============================================="
                    echo "BUILDING BACKEND DOCKER IMAGE"
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
        // 6. BUILD FRONTEND
        // =========================================================
        stage('Build Frontend Docker Image') {

            steps {

                sh '''
                    echo "=============================================="
                    echo "BUILDING FRONTEND DOCKER IMAGE"
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
        // 7. SHOW IMAGES
        // =========================================================
        stage('Show Docker Images') {

            steps {

                sh '''
                    echo "=============================================="
                    echo "SWM DOCKER IMAGES"
                    echo "=============================================="

                    docker images | grep -E "swm-backend|swm-frontend" || true
                '''
            }
        }


        // =========================================================
        // 8. PREPARE NETWORK
        // =========================================================
        stage('Prepare SWM Network') {

            steps {

                sh '''
                    echo "=============================================="
                    echo "PREPARING SWM NETWORK"
                    echo "=============================================="

                    if docker network inspect ${SWM_NETWORK} >/dev/null 2>&1
                    then
                        echo "Network ${SWM_NETWORK} already exists."
                    else
                        echo "Creating network ${SWM_NETWORK}..."
                        docker network create ${SWM_NETWORK}
                    fi

                    echo ""
                    echo "Network is ready."
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
                        echo "DEPLOYING BACKEND"
                        echo "=============================================="

                        docker run -d \
                            --name ${BACKEND_CONTAINER} \
                            --network ${SWM_NETWORK} \
                            --env-file "$ENV_FILE" \
                            -p 5000:5000 \
                            ${BACKEND_LOCAL_IMAGE}

                        echo ""
                        echo "Backend container created."

                        docker ps \
                            --filter "name=${BACKEND_CONTAINER}"
                    '''
                }
            }
        }


        // =========================================================
        // 10. WAIT FOR BACKEND
        // =========================================================
        stage('Wait for Backend') {

            steps {

                sh '''
                    echo "=============================================="
                    echo "WAITING FOR BACKEND"
                    echo "=============================================="

                    echo "Waiting for backend to start..."

                    SUCCESS=0

                    for i in $(seq 1 30)
                    do
                        echo "Attempt $i/30..."

                        if docker exec ${BACKEND_CONTAINER} node -e "
                            fetch('http://127.0.0.1:5000/api/health')
                              .then(response => {
                                  if (response.ok) {
                                      process.exit(0);
                                  } else {
                                      process.exit(1);
                                  }
                              })
                              .catch(() => {
                                  process.exit(1);
                              });
                        "
                        then
                            echo ""
                            echo "Backend is ready."
                            SUCCESS=1
                            break
                        fi

                        sleep 2
                    done

                    if [ "$SUCCESS" -ne 1 ]
                    then
                        echo ""
                        echo "=============================================="
                        echo "BACKEND FAILED TO START"
                        echo "=============================================="

                        echo ""
                        echo "Container status:"
                        docker ps -a --filter "name=${BACKEND_CONTAINER}"

                        echo ""
                        echo "Backend logs:"
                        docker logs ${BACKEND_CONTAINER} 2>&1 || true

                        echo ""
                        echo "Listening ports inside backend:"
                        docker exec ${BACKEND_CONTAINER} sh -c "ss -lntp || netstat -lntp || true"

                        exit 1
                    fi
                '''
            }
        }


        // =========================================================
        // 11. BACKEND HEALTH CHECK
        // =========================================================
        stage('Backend Health Check') {

            steps {

                sh '''
                    echo "=============================================="
                    echo "BACKEND HEALTH CHECK"
                    echo "=============================================="

                    docker exec ${BACKEND_CONTAINER} node -e "
                        fetch('http://127.0.0.1:5000/api/health')
                          .then(async response => {

                              const body = await response.text();

                              console.log('HTTP Status:', response.status);
                              console.log('Response:', body);

                              if (!response.ok) {
                                  process.exit(1);
                              }

                          })
                          .catch(error => {

                              console.error(error);
                              process.exit(1);

                          });
                    "

                    echo ""
                    echo "Backend health check PASSED."
                '''
            }
        }


        // =========================================================
        // 12. TEST STATISTICS API
        // =========================================================
        stage('Test Statistics API') {

            steps {

                sh '''
                    echo "=============================================="
                    echo "TESTING STATISTICS API"
                    echo "=============================================="

                    docker exec ${BACKEND_CONTAINER} node -e "
                        fetch('http://127.0.0.1:5000/api/stats')
                          .then(async response => {

                              const body = await response.text();

                              console.log('HTTP Status:', response.status);
                              console.log('Response:', body);

                              if (!response.ok) {
                                  process.exit(1);
                              }

                          })
                          .catch(error => {

                              console.error(error);
                              process.exit(1);

                          });
                    "

                    echo ""
                    echo "Statistics API test PASSED."
                '''
            }
        }


        // =========================================================
        // 13. DEPLOY FRONTEND
        // =========================================================
        stage('Deploy Frontend') {

            steps {

                sh '''
                    echo "=============================================="
                    echo "DEPLOYING FRONTEND"
                    echo "=============================================="

                    docker run -d \
                        --name ${FRONTEND_CONTAINER} \
                        --network ${SWM_NETWORK} \
                        -p 5443:5443 \
                        ${FRONTEND_LOCAL_IMAGE}

                    echo ""
                    echo "Frontend container created."

                    docker ps \
                        --filter "name=${FRONTEND_CONTAINER}"
                '''
            }
        }


        // =========================================================
        // 14. WAIT FOR FRONTEND
        // =========================================================
        stage('Wait for Frontend') {

            steps {

                sh '''
                    echo "=============================================="
                    echo "WAITING FOR FRONTEND"
                    echo "=============================================="

                    SUCCESS=0

                    for i in $(seq 1 30)
                    do
                        echo "Attempt $i/30..."

                        if docker exec ${FRONTEND_CONTAINER} node -e "
                            fetch('http://127.0.0.1:5443/swm/')
                              .then(response => {
                                  if (response.ok) {
                                      process.exit(0);
                                  } else {
                                      process.exit(1);
                                  }
                              })
                              .catch(() => {
                                  process.exit(1);
                              });
                        "
                        then
                            echo ""
                            echo "Frontend is ready."
                            SUCCESS=1
                            break
                        fi

                        sleep 2
                    done

                    if [ "$SUCCESS" -ne 1 ]
                    then
                        echo ""
                        echo "=============================================="
                        echo "FRONTEND FAILED TO START"
                        echo "=============================================="

                        echo ""
                        echo "Container status:"
                        docker ps -a --filter "name=${FRONTEND_CONTAINER}"

                        echo ""
                        echo "Frontend logs:"
                        docker logs ${FRONTEND_CONTAINER} 2>&1 || true

                        exit 1
                    fi
                '''
            }
        }


        // =========================================================
        // 15. FRONTEND HEALTH CHECK
        // =========================================================
        stage('Frontend Health Check') {

            steps {

                sh '''
                    echo "=============================================="
                    echo "FRONTEND HEALTH CHECK"
                    echo "=============================================="

                    docker exec ${FRONTEND_CONTAINER} node -e "
                        fetch('http://127.0.0.1:5443/swm/')
                          .then(async response => {

                              console.log('HTTP Status:', response.status);

                              if (!response.ok) {
                                  process.exit(1);
                              }

                          })
                          .catch(error => {

                              console.error(error);
                              process.exit(1);

                          });
                    "

                    echo ""
                    echo "Frontend health check PASSED."
                '''
            }
        }


        // =========================================================
        // 16. CHECK CONTAINERS
        // =========================================================
        stage('Check Containers') {

            steps {

                sh '''
                    echo "=============================================="
                    echo "CHECKING SWM CONTAINERS"
                    echo "=============================================="

                    docker ps -a \
                        --filter "name=${BACKEND_CONTAINER}" \
                        --filter "name=${FRONTEND_CONTAINER}"

                    echo ""
                    echo "SWM containers checked successfully."
                '''
            }
        }


        // =========================================================
        // 17. LOGIN TO HARBOR
        // =========================================================
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
                        echo "LOGIN TO HARBOR"
                        echo "=============================================="

                        echo "$HARBOR_PASSWORD" | docker login \
                            ${HARBOR_REGISTRY} \
                            --username "$HARBOR_USER" \
                            --password-stdin

                        echo ""
                        echo "Harbor login successful."
                    '''
                }
            }
        }


        // =========================================================
        // 18. TAG IMAGES
        // =========================================================
        stage('Tag Images') {

            steps {

                sh '''
                    echo "=============================================="
                    echo "TAGGING IMAGES"
                    echo "=============================================="

                    docker tag \
                        ${BACKEND_LOCAL_IMAGE} \
                        ${BACKEND_IMAGE}:build-${BUILD_NUMBER}

                    docker tag \
                        ${BACKEND_LOCAL_IMAGE} \
                        ${BACKEND_IMAGE}:latest

                    docker tag \
                        ${FRONTEND_LOCAL_IMAGE} \
                        ${FRONTEND_IMAGE}:build-${BUILD_NUMBER}

                    docker tag \
                        ${FRONTEND_LOCAL_IMAGE} \
                        ${FRONTEND_IMAGE}:latest

                    echo ""
                    echo "Images tagged successfully."
                '''
            }
        }


        // =========================================================
        // 19. PUSH BACKEND
        // =========================================================
        stage('Push Backend to Harbor') {

            steps {

                sh '''
                    echo "=============================================="
                    echo "PUSHING BACKEND TO HARBOR"
                    echo "=============================================="

                    docker push \
                        ${BACKEND_IMAGE}:build-${BUILD_NUMBER}

                    docker push \
                        ${BACKEND_IMAGE}:latest

                    echo ""
                    echo "Backend pushed successfully."
                '''
            }
        }


        // =========================================================
        // 20. PUSH FRONTEND
        // =========================================================
        stage('Push Frontend to Harbor') {

            steps {

                sh '''
                    echo "=============================================="
                    echo "PUSHING FRONTEND TO HARBOR"
                    echo "=============================================="

                    docker push \
                        ${FRONTEND_IMAGE}:build-${BUILD_NUMBER}

                    docker push \
                        ${FRONTEND_IMAGE}:latest

                    echo ""
                    echo "Frontend pushed successfully."
                '''
            }
        }


        // =========================================================
        // 21. LOGOUT HARBOR
        // =========================================================
        stage('Logout from Harbor') {

            steps {

                sh '''
                    echo "=============================================="
                    echo "LOGOUT FROM HARBOR"
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
============================================================
                 PIPELINE SUCCESS
============================================================

Smart Waste Management System deployed successfully.

Backend:
    Container       : swm-backend-container
    Port            : 5000
    Health Check    : PASSED
    Statistics API  : PASSED

Frontend:
    Container       : swm-frontend-container
    Port            : 5443
    Health Check    : PASSED

Harbor:
    Backend Image   : PUSHED
    Frontend Image  : PUSHED

============================================================
'''
        }


        failure {

            echo '''
============================================================
                 PIPELINE FAILED
============================================================

Collecting Docker information...

============================================================
'''

            sh '''
                echo ""
                echo "=============================================="
                echo "ALL CONTAINERS"
                echo "=============================================="

                docker ps -a || true


                echo ""
                echo "=============================================="
                echo "BACKEND CONTAINER"
                echo "=============================================="

                docker ps -a \
                    --filter "name=${BACKEND_CONTAINER}" || true

                echo ""
                echo "Backend logs:"

                docker logs ${BACKEND_CONTAINER} 2>&1 || true


                echo ""
                echo "=============================================="
                echo "FRONTEND CONTAINER"
                echo "=============================================="

                docker ps -a \
                    --filter "name=${FRONTEND_CONTAINER}" || true

                echo ""
                echo "Frontend logs:"

                docker logs ${FRONTEND_CONTAINER} 2>&1 || true
            '''
        }


        always {

            echo '''
============================================================
                 PIPELINE FINISHED
============================================================
'''
        }
    }
}
