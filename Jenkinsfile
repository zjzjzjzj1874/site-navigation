#!groovy
@Library('jenkinslib@main') _

def tools = new org.devops.tools()
def email = new org.devops.notify_email()
def wechat = new org.devops.notify_wechat()

pipeline {
  options {
    timestamps() // 显示日志时间戳 => 使用前先安装插件
    skipDefaultCheckout() // 隐式删checkout scm语句
    timeout(time: 60, unit: 'MINUTES') // 流水线超时设置:60min
  }

  agent none

  stages {

    stage('Check on Controller') {
      agent { label 'HOST' }

      stages {
        stage('Cleaning workspace') {
            steps {
                sh 'ls -l'
                sh 'sudo rm -rf ./*'
                }
        }

        stage('SCE Checkout') {
            steps {
                checkout scm
                sh 'git submodule update --init --force --remote'
            }
        }

        stage('Stash artifacts') {
          steps {
            stash name: 'source', includes: '**', excludes: '**/.git,**/.git/**'
          }
        }

        stage('Start Container') {
          steps {
                sh 'sudo chmod 777 sites.json'
                sh 'docker-compose build'
                sh 'docker-compose down'
                sh 'docker-compose up -d'
          }
        }
      }
    }
  }

  // 构建后操作
  post {
    always { script { tools.PrintMsg("构建完成","green") }}
    success { script { currentBuild.description = "构建成功！" }}
    failure { script {
        currentBuild.description = "构建失败！"
        tools.PrintMsg("构建失败,发送邮件和企业微信推送","red")
        email.EmailNotify("本次构建失败")
        wechat.WorkWechatNotifyWithMsg("https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=1d770f87-6f87-49cf-a3ed-5aa5ec38be80","构建失败")
    }}
    aborted { script { currentBuild.description = "取消本次构建！" }}
  }
}
