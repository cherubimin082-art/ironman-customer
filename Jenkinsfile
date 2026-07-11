pipeline {
    agent any

    stages {
        stage('Install') {
            steps {
                sh 'npm install --legacy-peer-deps --silent'
                sh 'cd backend && npm install --legacy-peer-deps --silent'
            }
        }
        stage('Build') {
            steps {
                sh 'rm -rf dist && npm run build --silent'
            }
        }
        stage('Deploy') {
            steps {
                sh '''
                    set -e
                    mkdir -p /var/www/ironman-customer
                    rm -rf /var/www/ironman-customer/dist /var/www/ironman-customer/backend
                    cp -r dist /var/www/ironman-customer/
                    cp -r backend /var/www/ironman-customer/
                    sed -i 's|</head>|<meta http-equiv="Cache-Control" content="no-cache,no-store,must-revalidate"><meta http-equiv="Pragma" content="no-cache"><meta http-equiv="Expires" content="0"></head>|' /var/www/ironman-customer/dist/index.html
                    pm2 delete smart-iron-customer || true
                    pm2 start /var/www/ironman-customer/backend/server.js --name smart-iron-customer
                '''
            }
        }
    }

    post {
        success { echo 'Customer deployed to dev.ironman.today!' }
        failure { echo 'Deployment failed — check logs above.' }
    }
}
