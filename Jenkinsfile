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
                    docker images | grep swm-
                '''
            }
        }
    }

    post {
        success {
            echo 'Docker images built successfully!'
        }

        failure {
            echo 'Docker build failed!'
        }
    }
}
