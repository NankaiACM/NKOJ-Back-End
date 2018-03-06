#include <iostream>
#include <cstdio>
using namespace std;
char str[100000];
char *f(int x){
	for(int i = 0; i < 4; i++){
		str[3-i] = x%10 +'0';
		x /= 10;
	}
	str[4] = '.'; str[5] = 'm'; str[6] = 'd';
	str[7] = '\0';
	return str;
}

int main(){
	freopen("1001.md", "r", stdin);
	char str[100000];
	int t = 0;
	while(scanf("%c", &str[t++]) != EOF); str[t] = '\0';
	for(int i = 1002; i <= 1020; i++){
		//cerr<<f(i)<<endl;
		freopen(f(i), "w", stdout);
		cout<<str;
	}
}
