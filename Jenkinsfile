pipeline {
    agent any

    stages {
        stage('Deploy') {
            steps {
                sh 'bash /home/ubuntu/deploy-customer.sh 2>&1'
            }
        }
    }

    post {
        success {
            echo 'Smart Iron Customer deployed to dev.ironman.today!'
        }
        failure {
            echo 'Deployment failed — check logs above.'
        }
    }
}
