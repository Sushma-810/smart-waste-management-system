pipeline {

    agent any

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build Backend Docker Image') {
            steps {
                sh '''
                    echo "===== Building Backend Image ====="

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
                    echo "===== Building Frontend Image ====="

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
                    echo "===== Docker Images ====="

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
                        echo "===== Deploying Backend ====="

                        docker rm -f swm-backend-container || true

                        docker run -d \
                        --name swm-backend-container \
                        --env-file "$ENV_FILE" \
                        -p 5000:5000 \
                        swm-backend:latest

                        echo "Backend container started"

                        sleep 5

                        echo "===== Backend Logs ====="
                        docker logs --tail 50 swm-backend-container
                    '''
                }
            }
        }

        stage('Deploy Frontend') {
            steps {
                sh '''
                    echo "===== Deploying Frontend ====="

                    docker rm -f swm-frontend-container || true

                    docker run -d \
                    --name swm-frontend-container \
                    -p 5173:80 \
                    swm-frontend:latest

                    echo "Frontend container started"
                '''
            }
        }

        stage('Check Containers') {
            steps {
                sh '''
                    echo "===== Running Containers ====="

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
            node -e "fetch('http://localhost:5000').then(r => { console.log('Backend HTTP Status:', r.status); process.exit(r.ok ? 0 : 1) }).catch(e => { console.error(e); process.exit(1) })"

            echo ""
            echo "Backend is responding successfully!"

            echo "===== Frontend Health Check ====="

            docker exec swm-frontend-container \
            wget -qO- http://localhost > /dev/null

            echo ""
            echo "Frontend is responding successfully!"
        '''
    }
}
    }

    post {

        success {
            echo '''
========================================
 Smart Waste Management Deployment
             SUCCESS
========================================

Frontend: http://localhost:5173
Backend:  http://localhost:5000

Both Docker containers are running.
========================================
'''
        }

        failure {
            echo '''
========================================
 Smart Waste Management Deployment
             FAILED
========================================

Check the Jenkins Console Output.
========================================
'''
        }
    }
}
