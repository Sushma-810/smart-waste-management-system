pipeline {
    agent any

    environment {
        HARBOR_REGISTRY = "172.28.63.77:8081"
        HARBOR_PROJECT = "smart-waste-management"

        BACKEND_IMAGE = "${HARBOR_REGISTRY}/${HARBOR_PROJECT}/swm-backend"
        FRONTEND_IMAGE = "${HARBOR_REGISTRY}/${HARBOR_PROJECT}/swm-frontend"
    }

    stages {

        stage('Checkout') {
            steps {
                echo "Checking out source code..."
                checkout scm
            }
        }

        stage('Build Backend Image') {
            steps {
                echo "Building backend Docker image..."

                sh '''
                    docker build \
                        -f swm-backend/swm.Dockerfile \
                        -t swm-backend:latest \
                        swm-backend
                '''
            }
        }

        stage('Build Frontend Image') {
            steps {
                echo "Building frontend Docker image..."

                sh '''
                    docker build \
                        -f swm-frontend/swmfront.Dockerfile \
                        -t swm-frontend:latest \
                        swm-frontend
                '''
            }
        }

        stage('Prepare Docker Network') {
            steps {
                echo "Preparing Docker network..."

                sh '''
                    docker network inspect swm >/dev/null 2>&1 || \
                    docker network create swm
                '''
            }
        }

        stage('Deploy Backend Container') {
            steps {
                echo "Deploying backend container..."

                withCredentials([file(
                    credentialsId: 'swm-backend-env',
                    variable: 'ENV_FILE'
                )]) {
                    sh '''
                        docker rm -f swm-backend-container || true

                        docker run -d \
                            --name swm-backend-container \
                            --network swm \
                            --env-file "$ENV_FILE" \
                            -p 5000:5000 \
                            swm-backend:latest
                    '''
                }
            }
        }

        stage('Deploy Frontend Container') {
            steps {
                echo "Deploying frontend container..."

                sh '''
                    docker rm -f swm-frontend-container || true

                    docker run -d \
                        --name swm-frontend-container \
                        --network swm \
                        -p 5443:5443 \
                        swm-frontend:latest
                '''
            }
        }

        stage('Backend Health Check') {
            steps {
                echo "Checking backend health..."

                sh '''
                    echo "Waiting for backend to become ready..."

                    for i in $(seq 1 12); do

                        if docker exec swm-backend-container \
                        node -e "
                            fetch('http://localhost:5000/api/health')
                            .then(r => {
                                console.log('Backend HTTP Status:', r.status);
                                process.exit(
                                    r.status >= 200 && r.status < 500 ? 0 : 1
                                );
                            })
                            .catch(() => process.exit(1));
                        "
                        then
                            echo "Backend is ready!"
                            break
                        fi

                        echo "Backend not ready yet... attempt $i/12"
                        sleep 5

                        if [ "$i" -eq 12 ]; then
                            echo "Backend failed to become ready."
                            echo "Backend container logs:"
                            docker logs swm-backend-container --tail 50
                            exit 1
                        fi

                    done
                '''
            }
        }

        stage('Frontend Health Check') {
            steps {
                echo "Checking frontend health..."

                sh '''
                    sleep 3

                    docker exec swm-frontend-container \
                    node -e "
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
                '''
            }
        }

        stage('Push Backend Image to Harbor') {
            steps {
                echo "Pushing backend image to Harbor..."

                sh '''
                    docker tag \
                        swm-backend:latest \
                        ${BACKEND_IMAGE}:latest

                    docker push \
                        ${BACKEND_IMAGE}:latest
                '''
            }
        }

        stage('Push Frontend Image to Harbor') {
            steps {
                echo "Pushing frontend image to Harbor..."

                sh '''
                    docker tag \
                        swm-frontend:latest \
                        ${FRONTEND_IMAGE}:latest

                    docker push \
                        ${FRONTEND_IMAGE}:latest
                '''
            }
        }
    }

    post {
        success {
            echo '''
            ==========================================
            Smart Waste Management Deployment SUCCESS
            ==========================================

            Backend:
              Container: swm-backend-container
              Port: 5000
              RDS PostgreSQL: Connected through environment

            Frontend:
              Container: swm-frontend-container
              Port: 5443

            Harbor:
              Backend and Frontend images pushed successfully.

            ==========================================
            '''
        }

        failure {
            echo '''
            ==========================================
            Smart Waste Management Deployment FAILED
            ==========================================

            Check Jenkins console output and container logs.

            ==========================================
            '''

            sh '''
                echo "Running containers:"
                docker ps -a --filter "name=swm-"

                echo ""
                echo "Backend logs:"
                docker logs swm-backend-container --tail 50 2>/dev/null || true

                echo ""
                echo "Frontend logs:"
                docker logs swm-frontend-container --tail 50 2>/dev/null || true
            '''
        }

        always {
            echo "Jenkins pipeline completed."
        }
    }
}
