install:
	rsync -av * -e ssh ec2-user@54.248.75.147:~/web/

publish:
	sudo cp -r * /usr/share/nginx/html
