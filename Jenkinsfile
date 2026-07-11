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
                    rm -rf /var/www/ironman-customer/dist
                    cp -r dist /var/www/ironman-customer/
                    sed -i 's|</head>|<meta http-equiv="Cache-Control" content="no-cache,no-store,must-revalidate"><meta http-equiv="Pragma" content="no-cache"><meta http-equiv="Expires" content="0"></head>|' /var/www/ironman-customer/dist/index.html

                    # The actual running backend ("customer-api") lives at
                    # /home/ubuntu/ironman-customer/backend, same as the admin repo's
                    # proven /home/ubuntu/ironman-admin/backend pattern - NOT
                    # /var/www/ironman-customer/backend, which has no .env and was
                    # never the real target. Copy code only (never touch .env), then
                    # restart the EXISTING process by its real name so it keeps
                    # whatever DB/JWT/Razorpay config already works there.
                    mkdir -p /home/ubuntu/ironman-customer/backend
                    for item in backend/*; do
                        name=$(basename "$item")
                        [ "$name" = ".env" ] && continue
                        cp -r "$item" /home/ubuntu/ironman-customer/backend/
                    done

                    pm2 restart customer-api --update-env
                    sleep 3

                    if ! curl -sf "http://localhost:5001/api/health" > /dev/null; then
                        echo "DEPLOY VERIFICATION FAILED: API not responding on port 5001 after restart."
                        pm2 logs customer-api --lines 40 --nostream || true
                        exit 1
                    fi
                    echo "Deploy verified: customer-api responding on port 5001."
                '''
            }
        }
    }

    post {
        success { echo 'Customer deployed to dev.ironman.today!' }
        failure { echo 'Deployment failed — check logs above.' }
    }
}
