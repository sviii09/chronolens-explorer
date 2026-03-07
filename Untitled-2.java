import java.util.*;
class UFDS{
    int n;
    int[] parent;
    int islandcount;
    public UFDS(int n){
        this.n = n;
        this.islandcount=n;
        parent = new int[n];
        for(int i=0;i<n;i++){
            parent[i] = i;
        }
    }
    public int find(int a){//to find the supreme leader of the set
        if(parent[a] == a) return a;
        return parent[a] = find(parent[a]);// path compression
    }
    public boolean merge(int a, int b){ // return true if merge is successful, false if they are already in the same set
        int leaderofA = find(a);
        int leaderofB = find(b);
        if(leaderofA == leaderofB) return false;// already in the same set

        parent[leaderofA] = leaderofB;
        islandcount--;
        return true;

    }
}