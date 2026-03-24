#include <stdio.h>
#include <string.h>
int main() {
	char buf[100];
	int a = 2
	char *cmd[a] = {
		"exit\n",
		"echo\n"
	};
	int running = 1;
	while (running) {
		fgets(buf,100,stdin);
		for (int i = 0;i < a;i++) {
			if (!(strcmp(buf,cmd[i])) {
				switch (i) {
					case 0:
						running = 0;
						break;
					default:
						printf("how did you manage to get this");
			}
		} else {
			printf("dunno what that is");
		}
	}
	return 0;
}
