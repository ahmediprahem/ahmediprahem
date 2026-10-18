import cv2, numpy as np, json
cap=cv2.VideoCapture('/mnt/user-data/uploads/0dc6abd0-c06f-46da-b957-2c19cde24107.mp4'); frames=[]
while True:
    ok,f=cap.read()
    if not ok: break
    frames.append(f)
N=len(frames); bgc=np.array([93,33,9],float)
# قالب الشفافية من إطار 210 (أعلى اليسار) مقابل إطار 90 (نفس المنطقة نظيفة)
X0,Y0,W,H=30,34,500,92
a_f=frames[210][Y0:Y0+H,X0:X0+W].astype(float); a_b=frames[90][Y0:Y0+H,X0:X0+W].astype(float)
alpha=np.clip(np.mean((a_f-a_b)/(255.0-a_b+1e-6),axis=2),0,0.95); alpha[alpha<0.05]=0
print('أقصى شفافية في القالب:',round(float(alpha.max()),2),'| بكسلات العلامة:',int((alpha>0.1).sum()))
cv2.imwrite('alpha.png',(alpha*255).astype(np.uint8))
corners={'TL':(30,34),'TR':(770,34),'BR':(770,596),'BL':(30,594)}
def bright(f): return np.clip(f.astype(float).mean(axis=2)-bgc.mean(),0,255)
res=[]; out=[]
for i,f in enumerate(frames):
    br=bright(f); best=(-1,None,None)
    for k,(cx,cy) in corners.items():
        y0,y1,x0,x1=max(0,cy-10),min(720,cy+H+10),max(0,cx-14),min(1280,cx+W+14)
        win=br[y0:y1,x0:x1].astype(np.float32)
        if win.shape[0]<H or win.shape[1]<W: continue
        m=cv2.matchTemplate(win,alpha.astype(np.float32),cv2.TM_CCOEFF_NORMED); _,mx,_,loc=cv2.minMaxLoc(m)
        if mx>best[0]: best=(mx,k,(x0+loc[0],y0+loc[1]))
    res.append((i,round(float(best[0]),2),best[1],best[2]))
    o=f.astype(float)
    if best[0]>0.35:
        x,y=best[2]; reg=o[y:y+H,x:x+W]; a=alpha[...,None]; rec=(reg-a*255.0)/(1-a); rec=np.clip(rec,0,255)
        m=cv2.dilate((alpha>0.02).astype(np.uint8),np.ones((7,7),np.uint8)).astype(bool); d=np.abs(rec-bgc).sum(axis=2); flat=m&(d<70); rec[flat]=bgc; o[y:y+H,x:x+W]=rec
    out.append(o.astype(np.uint8))
sc=[r[1] for r in res]; print('أدنى/متوسط درجة المطابقة:',min(sc),round(sum(sc)/N,2),'| إطارات بلا اكتشاف (<0.35):',[r[0] for r in res if r[1]<=0.35][:20])
json.dump(res,open('wm_pos.json','w'))
import pickle; pickle.dump(out,open('clean.pkl','wb'))
# مقارنة بصرية: إطارات 5, 20, 40, 70, 125, 160
sel=[5,20,40,70,125,160]; rows=[]
for i in sel:
    a=cv2.resize(frames[i],(640,360)); b=cv2.resize(out[i],(640,360)); rows.append(np.hstack([a,b]))
cv2.imwrite('compare.png',np.vstack([np.hstack([rows[0],rows[1]]) if False else rows[0]]+rows[1:3]))
cv2.imwrite('compare2.png',np.vstack(rows[3:]))
print('mean frame idx -> corner:',[(r[0],r[2]) for r in res[::30]])
