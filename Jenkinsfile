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
                sh '''
                    echo "===== Deploying Backend ====="

                    docker rm -f swm-backend-container || true

                    docker run -d \
                    --name swm-backend-container \
                    -p 5000:5000 \
                    swm-backend:latest

                    echo "Backend container started"
                '''
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
    }

    post {

        success {
            echo '======================================'
            echo 'Smart Waste Management deployed!'
            echo 'Frontend: http://localhost:5173'
            echo 'Backend:  http://localhost:5000'
            echo '======================================'
        }

        failure {
            echo '======================================'
            echo 'Smart Waste Management deployment FAILED!'
            echo 'Check the Console Output.'
            echo '======================================'
        }
    }
}
