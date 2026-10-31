pipeline {
    agent any

    options {
        skipDefaultCheckout(true)
        timestamps()
    }

    environment {
        // =========================
        // HARBOR
        // =========================
        HARBOR_REGISTRY = '172.28.63.77:8081'
        HARBOR_PROJECT  = 'smart-waste-management'

        // =========================
        // LOCAL IMAGES
        // =========================
        BACKEND_LOCAL_IMAGE  = 'swm-backend:latest'
        FRONTEND_LOCAL_IMAGE = 'swm-frontend:latest'

        // =========================
        // HARBOR IMAGES
        // =========================
        BACKEND_HARBOR_IMAGE  = "${HARBOR_REGISTRY}/${HARBOR_PROJECT}/swm-backend:latest"
        FRONTEND_HARBOR_IMAGE = "${HARBOR_REGISTRY}/${HARBOR_PROJECT}/swm-frontend:latest"

        // =========================
        // CONTAINERS
        // =========================
        BACKEND_CONTAINER  = 'swm-backend-container'
        FRONTEND_CONTAINER = 'swm-frontend-container'

        // =========================
        // NETWORK
        // =========================
        SWM_NETWORK = 'swm'
    }

    stages {

        // =====================================================
        // 1. CHECKOUT
        // =====================================================
        stage('Checkout') {
            steps {
                echo '========== CHECKOUT =========='

                checkout scm
            }
        }

        // =====================================================
        // 2. REMOVE OLD CONTAINERS AND IMAGES
        // =====================================================
        stage('Cleanup Old Containers and Images') {
            steps {
                echo '========== CLEANUP =========='

                sh '''
                    echo "Removing old containers..."

                    docker rm -f ${BACKEND_CONTAINER} 2>/dev/null || true
                    docker rm -f ${FRONTEND_CONTAINER} 2>/dev/null || true

                    echo "Removing old images..."

                    docker rmi -f ${BACKEND_LOCAL_IMAGE} 2>/dev/null || true
                    docker rmi -f ${FRONTEND_LOCAL_IMAGE} 2>/dev/null || true

                    echo "Cleanup completed."
                '''
            }
        }

        // =====================================================
        // 3. BUILD BACKEND IMAGE
        // =====================================================
        stage('Build Backend Image') {
            steps {
                echo '========== BUILD BACKEND IMAGE =========='

                sh '''
                    docker build \
                        -f swm-backend/swm.Dockerfile \
                        -t ${BACKEND_LOCAL_IMAGE} \
                        ./swm-backend
                '''
            }
        }

        // =====================================================
        // 4. BUILD FRONTEND IMAGE
        // =====================================================
        stage('Build Frontend Image') {
            steps {
                echo '========== BUILD FRONTEND IMAGE =========='

                sh '''
                    docker build \
                        -f swm-frontend/swmfront.Dockerfile \
                        -t ${FRONTEND_LOCAL_IMAGE} \
                        ./swm-frontend
                '''
            }
        }

        // =====================================================
        // 5. PREPARE DOCKER NETWORK
        // =====================================================
        stage('Prepare Docker Network') {
            steps {
                echo '========== DOCKER NETWORK =========='

                sh '''
                    docker network inspect ${SWM_NETWORK} >/dev/null 2>&1 || \
                    docker network create ${SWM_NETWORK}

                    echo "Docker network ready:"
                    docker network inspect ${SWM_NETWORK} --format '{{.Name}}'
                '''
            }
        }

        // =====================================================
        // 6. DEPLOY BACKEND CONTAINER
        // =====================================================
        stage('Deploy Backend Container') {
            steps {
                echo '========== DEPLOY BACKEND =========='

                withCredentials([
                    file(
                        credentialsId: 'swm-backend-env',
                        variable: 'ENV_FILE'
                    )
                ]) {
                    sh '''
                        docker run -d \
                            --name ${BACKEND_CONTAINER} \
                            --network ${SWM_NETWORK} \
                            --env-file "$ENV_FILE" \
                            -p 5000:5000 \
                            ${BACKEND_LOCAL_IMAGE}

                        echo "Backend container started."

                        docker ps --filter "name=${BACKEND_CONTAINER}"
                    '''
                }
            }
        }

        // =====================================================
        // 7. TEST BACKEND
        // =====================================================
        stage('Test Backend') {
            steps {
                echo '========== TEST BACKEND =========='

                sh '''
                    echo "Waiting for backend..."

                    for i in $(seq 1 30)
                    do
                        if docker exec ${BACKEND_CONTAINER} \
                            node -e "fetch('http://127.0.0.1:5000/api/health').then(r=>{if(!r.ok)process.exit(1);return r.text()}).then(console.log).catch(()=>process.exit(1))"
                        then
                            echo "Backend is ready."
                            break
                        fi

                        echo "Backend not ready. Attempt $i/30"
                        sleep 2

                        if [ "$i" = "30" ]; then
                            echo "Backend failed to start."
                            docker logs ${BACKEND_CONTAINER}
                            exit 1
                        fi
                    done

                    echo "Testing Health API..."

                    docker exec ${BACKEND_CONTAINER} \
                        node -e "fetch('http://127.0.0.1:5000/api/health').then(r=>r.text()).then(console.log)"

                    echo "Testing Statistics API..."

                    docker exec ${BACKEND_CONTAINER} \
                        node -e "fetch('http://127.0.0.1:5000/api/stats').then(r=>r.text()).then(console.log)"

                    echo "Backend tests completed."
                '''
            }
        }

        // =====================================================
        // 8. DEPLOY FRONTEND CONTAINER
        // =====================================================
        stage('Deploy Frontend Container') {
            steps {
                echo '========== DEPLOY FRONTEND =========='

                sh '''
                    docker run -d \
                        --name ${FRONTEND_CONTAINER} \
                        --network ${SWM_NETWORK} \
                        -p 5443:5443 \
                        ${FRONTEND_LOCAL_IMAGE}

                    echo "Frontend container started."

                    docker ps --filter "name=${FRONTEND_CONTAINER}"
                '''
            }
        }

        // =====================================================
        // 9. TEST FRONTEND
        // =====================================================
        stage('Test Frontend') {
            steps {
                echo '========== TEST FRONTEND =========='

                sh '''
                    echo "Waiting for frontend..."

                    for i in $(seq 1 30)
                    do
                        if docker exec ${FRONTEND_CONTAINER} \
                            node -e "fetch('http://127.0.0.1:5443/swm/').then(r=>{if(!r.ok)process.exit(1);return r.text()}).then(()=>console.log('Frontend OK')).catch(()=>process.exit(1))"
                        then
                            echo "Frontend is ready."
                            break
                        fi

                        echo "Frontend not ready. Attempt $i/30"
                        sleep 2

                        if [ "$i" = "30" ]; then
                            echo "Frontend failed to start."
                            docker logs ${FRONTEND_CONTAINER}
                            exit 1
                        fi
                    done

                    echo "Frontend test completed."
                '''
            }
        }

        // =====================================================
        // 10. SHOW RUNNING APPLICATION
        // =====================================================
        stage('Show Deployment') {
            steps {
                echo '========== DEPLOYMENT STATUS =========='

                sh '''
                    docker ps \
                        --filter "name=${BACKEND_CONTAINER}" \
                        --filter "name=${FRONTEND_CONTAINER}"

                    echo ""
                    echo "Backend:"
                    docker logs --tail 20 ${BACKEND_CONTAINER}

                    echo ""
                    echo "Frontend:"
                    docker logs --tail 20 ${FRONTEND_CONTAINER}
                '''
            }
        }

        // =====================================================
        // 11. LOGIN TO HARBOR
        // =====================================================
        stage('Harbor Login') {
            steps {
                echo '========== HARBOR LOGIN =========='

                withCredentials([
                    usernamePassword(
                        credentialsId: 'harbor-credentials',
                        usernameVariable: 'HARBOR_USER',
                        passwordVariable: 'HARBOR_PASSWORD'
                    )
                ]) {
                    sh '''
                        echo "$HARBOR_PASSWORD" | docker login \
                            ${HARBOR_REGISTRY} \
                            -u "$HARBOR_USER" \
                            --password-stdin
                    '''
                }
            }
        }

        // =====================================================
        // 12. TAG IMAGES FOR HARBOR
        // =====================================================
        stage('Tag Images for Harbor') {
            steps {
                echo '========== TAG HARBOR IMAGES =========='

                sh '''
                    docker tag \
                        ${BACKEND_LOCAL_IMAGE} \
                        ${BACKEND_HARBOR_IMAGE}

                    docker tag \
                        ${FRONTEND_LOCAL_IMAGE} \
                        ${FRONTEND_HARBOR_IMAGE}

                    echo "Images tagged:"
                    docker images | grep swm
                '''
            }
        }

        // =====================================================
        // 13. PUSH TO HARBOR
        // =====================================================
        stage('Push Images to Harbor') {
            steps {
                echo '========== PUSH TO HARBOR =========='

                sh '''
                    docker push ${BACKEND_HARBOR_IMAGE}
                    docker push ${FRONTEND_HARBOR_IMAGE}

                    echo "Both images pushed successfully."
                '''
            }
        }

        // =====================================================
        // 14. LOGOUT HARBOR
        // =====================================================
        stage('Harbor Logout') {
            steps {
                echo '========== HARBOR LOGOUT =========='

                sh '''
                    docker logout ${HARBOR_REGISTRY} || true
                '''
            }
        }
    }

    post {
        success {
            echo '''
            ==========================================
            PIPELINE SUCCESS
            ==========================================

            Backend container : swm-backend-container
            Frontend container: swm-frontend-container

            Backend:
            http://localhost:5000/api/health

            Frontend:
            http://localhost:5443/swm/

            Harbor:
            172.28.63.77:8081/smart-waste-management
            ==========================================
            '''
        }

        failure {
            echo '========== PIPELINE FAILED =========='

            sh '''
                echo "Containers:"
                docker ps -a | grep -E "swm-backend-container|swm-frontend-container" || true

                echo ""
                echo "Backend logs:"
                docker logs ${BACKEND_CONTAINER} 2>/dev/null || true

                echo ""
                echo "Frontend logs:"
                docker logs ${FRONTEND_CONTAINER} 2>/dev/null || true
            '''
        }
    }
}
