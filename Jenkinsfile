pipeline {
    agent any

    environment {
        HARBOR_REGISTRY = '172.28.63.77:8081'
        HARBOR_PROJECT  = 'smart-waste-management'

        BACKEND_IMAGE   = "${HARBOR_REGISTRY}/${HARBOR_PROJECT}/swm-backend"
        FRONTEND_IMAGE  = "${HARBOR_REGISTRY}/${HARBOR_PROJECT}/swm-frontend"
    }

    stages {

        // =========================================================
        // 1. CHECKOUT
        // =========================================================

        stage('Checkout') {
            steps {
                echo '===== Checking Out Smart Waste Management Source Code ====='

                checkout scm
            }
        }


        // =========================================================
        // 2. CLEAN OLD CONTAINERS
        // =========================================================

        stage('Cleanup Old Containers') {
            steps {
                sh '''
                    echo "=============================================="
                    echo "Removing Old Smart Waste Containers"
                    echo "=============================================="

                    docker rm -f swm-backend-container || true
                    docker rm -f swm-frontend-container || true

                    echo "Old containers removed successfully."
                '''
            }
        }


        // =========================================================
        // 3. BUILD BACKEND IMAGE
        // =========================================================

        stage('Build Backend Docker Image') {
            steps {
                sh '''
                    echo "=============================================="
                    echo "Building Smart Waste Backend Docker Image"
                    echo "=============================================="

                    docker build \
                        -f swm-backend/swm.Dockerfile \
                        -t swm-backend:latest \
                        ./swm-backend

                    echo "Backend Docker image built successfully."
                '''
            }
        }


        // =========================================================
        // 4. BUILD FRONTEND IMAGE
        // =========================================================

        stage('Build Frontend Docker Image') {
            steps {
                sh '''
                    echo "=============================================="
                    echo "Building Smart Waste Frontend Docker Image"
                    echo "=============================================="

                    docker build \
                        -f swm-frontend/swmfront.Dockerfile \
                        -t swm-frontend:latest \
                        ./swm-frontend

                    echo "Frontend Docker image built successfully."
                '''
            }
        }


        // =========================================================
        // 5. SHOW LOCAL IMAGES
        // =========================================================

        stage('Show Docker Images') {
            steps {
                sh '''
                    echo "=============================================="
                    echo "Smart Waste Docker Images"
                    echo "=============================================="

                    docker images | grep swm-
                '''
            }
        }


        // =========================================================
        // 6. PREPARE SWM NETWORK
        // =========================================================

        stage('Prepare SWM Network') {
            steps {
                sh '''
                    echo "=============================================="
                    echo "Preparing SWM Docker Network"
                    echo "=============================================="

                    docker network inspect swm >/dev/null 2>&1 || \
                    docker network create swm

                    echo "SWM Docker network is ready."
                '''
            }
        }


        // =========================================================
        // 7. DEPLOY BACKEND
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
                        echo "Deploying Smart Waste Backend"
                        echo "=============================================="

                        docker rm -f swm-backend-container || true

                        docker run -d \
                            --name swm-backend-container \
                            --network swm \
                            --env-file "$ENV_FILE" \
                            -p 5000:5000 \
                            swm-backend:latest

                        echo "Backend container started successfully."
                    '''
                }
            }
        }


        // =========================================================
        // 8. DEPLOY FRONTEND
        // =========================================================

        stage('Deploy Frontend') {
            steps {
                sh '''
                    echo "=============================================="
                    echo "Deploying Smart Waste Frontend"
                    echo "=============================================="

                    docker rm -f swm-frontend-container || true

                    docker run -d \
                        --name swm-frontend-container \
                        --network swm \
                        -p 5443:5443 \
                        swm-frontend:latest

                    echo "Frontend container started."

                    sleep 10

                    echo "=============================================="
                    echo "Frontend Deployment Check"
                    echo "=============================================="

                    docker exec swm-frontend-container node -e "
                    fetch('http://localhost:5443/swm/')
                    .then(r => {
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

                    echo "Frontend deployment check completed successfully."
                '''
            }
        }


        // =========================================================
        // 9. CHECK CONTAINERS
        // =========================================================

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


        // =========================================================
        // 10. HEALTH CHECK
        // =========================================================

        stage('Health Check') {
            steps {
                sh '''
                    echo "=============================================="
                    echo "Backend Health Check"
                    echo "=============================================="

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

                    echo "Backend is responding successfully."


                    echo "=============================================="
                    echo "Frontend Health Check"
                    echo "=============================================="

                    docker exec swm-frontend-container \
                    node -e "
                        fetch('http://localhost:5443/swm/')
                        .then(r => {
                            console.log('Frontend HTTP Status:', r.status);

                            if (r.status >= 200 && r.status < 500) {
                                console.log('Frontend application is responding!');
                                process.exit(0);
                            } else {
                                console.log('Frontend health check failed!');
                                process.exit(1);
                            }
                        })
                        .catch(e => {
                            console.error('Frontend connection failed:', e);
                            process.exit(1);
                        })
                    "

                    echo "Frontend is responding successfully."

                    echo "=============================================="
                    echo "All Health Checks Passed"
                    echo "=============================================="
                '''
            }
        }


        // =========================================================
        // 11. LOGIN TO HARBOR
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


        // =========================================================
        // 12. TAG IMAGES
        // =========================================================

        stage('Tag Images for Harbor') {
            steps {
                sh '''
                    echo "=============================================="
                    echo "Creating Harbor Image Tags"
                    echo "=============================================="

                    echo "----- Backend Tags -----"

                    docker tag \
                        swm-backend:latest \
                        "$BACKEND_IMAGE:build-${BUILD_NUMBER}"

                    docker tag \
                        swm-backend:latest \
                        "$BACKEND_IMAGE:latest"


                    echo "----- Frontend Tags -----"

                    docker tag \
                        swm-frontend:latest \
                        "$FRONTEND_IMAGE:build-${BUILD_NUMBER}"

                    docker tag \
                        swm-frontend:latest \
                        "$FRONTEND_IMAGE:latest"


                    echo "=============================================="
                    echo "Harbor Tags Created"
                    echo "=============================================="

                    docker images | grep smart-waste-management
                '''
            }
        }


        // =========================================================
        // 13. PUSH IMAGES TO HARBOR
        // =========================================================

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


                    echo "=============================================="
                    echo "All Images Pushed Successfully"
                    echo "=============================================="
                '''
            }
        }


        // =========================================================
        // 14. LOGOUT FROM HARBOR
        // =========================================================

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


    // =============================================================
    // POST BUILD
    // =============================================================

    post {

        success {
            echo '''
==============================================
SMART WASTE MANAGEMENT CI/CD SUCCESS
==============================================

Source code checkout       : SUCCESS
Old containers cleanup     : SUCCESS
Backend image build        : SUCCESS
Frontend image build       : SUCCESS
Backend deployment         : SUCCESS
Frontend deployment        : SUCCESS
Health checks              : SUCCESS
Harbor login               : SUCCESS
Images tagged              : SUCCESS
Images pushed to Harbor    : SUCCESS
Harbor logout              : SUCCESS

Smart Waste Management CI/CD completed successfully.
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
        }
    }
}
