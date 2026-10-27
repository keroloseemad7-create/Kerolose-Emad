# CGI scene: a 3D Opta Tribxon bottle comes from deep inside a giant phone screen and
# pushes out toward the viewer in three beats, then settles as a hero shot.
#   python3 scene.py still 0.5,3.8,7       -> stills/still_<t>.png
#   python3 scene.py anim <f0> <f1>        -> frames/0001.png ... (1-based, 24fps)
import bpy, bmesh, math, random, sys, os
from math import sin, cos, pi, radians
HERE=os.path.dirname(os.path.abspath(__file__)); FPS=24; DUR=12
C=lambda x,a=0,b=1:min(b,max(a,x)); seg=lambda t,a,b:C((t-a)/(b-a)); L=lambda a,b,x:a+(b-a)*x
eo=lambda x:1-(1-x)**3
eio=lambda x:4*x**3 if x<.5 else 1-(-2*x+2)**3/2
def back(x,c=1.4): return 1+(c+1)*(x-1)**3+c*(x-1)**2
EASE={'eo':eo,'back':back,'eio':eio}

# ---------------- timeline (matches the overlay texts in overlay.html)
# [start, duration, y (depth; phone screen at y=0, camera at y≈-2.7), z, easing]
KEYS=[[0,0,3.0,.82],[.1,1.3,1.45,.82,'eo'],[1.5,.38,.35,.82,'back'],[2.4,.38,-.85,.82,'back'],[3.3,.32,-2.2,.83,'back'],[5.3,.7,-1.05,1.0,'eio']]
POP=3.42
def pose(t):
    y,z=KEYS[0][2],KEYS[0][3]; twist=0
    for k0,d,ky,kz,e in KEYS[1:]:
        p=seg(t,k0,k0+d)
        if p<=0: break
        f=EASE[e](p); y=L(y,ky,f); z=L(z,kz,f); twist+=sin(pi*p)*22*(1 if e=='back' else 0)
    rz=sin(t*1.3)*12+twist+(-14*eio(seg(t,5.3,6.2)))+(sin((t-6)*1.1)*10 if t>6 else 0)
    rx=sin(t*2.1)*3
    z+=sin(t*3.1)*.006
    return (0,y,z),(radians(rx),0,radians(rz))
def cam_pose(t):
    y=L(-2.75,-2.6,eio(seg(t,0,3.3)))
    q=t-POP; sh=sin(q*85)*.012*(1-q/.45) if 0<q<.45 else 0
    return (sh*.7,y,.82+sh)

# ---------------- reset
bpy.ops.wm.read_factory_settings(use_empty=True)
sc=bpy.context.scene

def mat(name,**kw):
    m=bpy.data.materials.new(name); m.use_nodes=True
    b=m.node_tree.nodes['Principled BSDF']
    for k,v in kw.items(): b.inputs[k].default_value=v
    return m
def link(ob):
    sc.collection.objects.link(ob); return ob
def mesh_obj(name,bm,m=None,smooth=True):
    me=bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
    if smooth:
        for p in me.polygons: p.use_smooth=True
    ob=link(bpy.data.objects.new(name,me))
    if m: ob.data.materials.append(m)
    return ob
def lathe(name,prof,m,seg_=128,uv=False):
    bm=bmesh.new(); uvl=bm.loops.layers.uv.new() if uv else None
    rings=[[bm.verts.new((r*cos(-pi/2+(j/seg_)*2*pi-pi),r*sin(-pi/2+(j/seg_)*2*pi-pi),z)) for j in range(seg_)] for r,z in prof]
    for i in range(len(rings)-1):
        for j in range(seg_):
            j2=(j+1)%seg_
            f=bm.faces.new((rings[i][j],rings[i][j2],rings[i+1][j2],rings[i+1][j]))
            if uv:
                vs=[1-i/(len(rings)-1),1-(i+1)/(len(rings)-1)]
                for lp,(u,v) in zip(f.loops,[(j/seg_,vs[0]),((j+1)/seg_,vs[0]),((j+1)/seg_,vs[1]),(j/seg_,vs[1])]): lp[uvl].uv=(u,v)
    bmesh.ops.remove_doubles(bm,verts=bm.verts,dist=1e-6) if not uv else None
    bmesh.ops.recalc_face_normals(bm,faces=bm.faces)
    return mesh_obj(name,bm,m)

# ---------------- bottle
R=.1
M_CAP=mat('cap',**{'Base Color':(.01,.03,.45,1),'Roughness':.08,'Coat Weight':1,'Coat Roughness':.02})
M_GLASS=mat('glass',**{'Base Color':(.10,.22,1,1),'Roughness':.03,'Transmission Weight':1,'IOR':1.47})
M_CAPS=mat('capsule',**{'Base Color':(.008,.015,.09,1),'Roughness':.22,'Coat Weight':.6})
M_BAND=mat('band',**{'Base Color':(.01,.03,.25,1),'Roughness':.3})
M_LABEL=mat('label',**{'Roughness':.42,'Coat Weight':.35,'Coat Roughness':.15})
nt=M_LABEL.node_tree; tex=nt.nodes.new('ShaderNodeTexImage'); tex.image=bpy.data.images.load(os.path.join(HERE,'label.png'))
tex.interpolation='Cubic'; nt.links.new(tex.outputs['Color'],nt.nodes['Principled BSDF'].inputs['Base Color'])

zc=.115
cap_prof=[(max(1e-4,R*sin(radians(a))),zc+R*cos(radians(a))) for a in range(0,91,5)]+[(R,.1015),(R*.9,.1015),(1e-4,.1015)]
fr=.042; bx=R*.975
body_prof=[(1e-4,.1),(bx,.1),(bx,-.215+fr)]+[(bx-fr+fr*cos(radians(a)),-.215+fr-fr*sin(radians(a))) for a in range(10,91,10)]+[(1e-4,-.215)]
parts=[lathe('cap',cap_prof,M_CAP),lathe('body',body_prof,M_GLASS),
       lathe('band',[(R*1.004,.1045),(R*1.004,.0985)],M_BAND),
       lathe('label',[(bx+.0016,.0755),(bx+.0016,-.1445)],M_LABEL,256,uv=True)]
bpy.ops.mesh.primitive_uv_sphere_add(segments=20,ring_count=12,radius=1)
cp=bpy.context.object; cp.data.materials.append(M_CAPS); bpy.ops.object.shade_smooth()
cp.scale=(.0095,.0095,.026); cp.name='capsule0'
random.seed(4); caps=[cp]
for i in range(150):
    while True:
        x,y=random.uniform(-.062,.062),random.uniform(-.062,.062)
        if x*x+y*y<.062**2: break
    o=cp if i==0 else link(bpy.data.objects.new(f'capsule{i}',cp.data))
    o.scale=cp.scale; o.location=(x,y,random.uniform(-.188,.092))
    o.rotation_euler=(random.uniform(0,pi),random.uniform(0,pi),random.uniform(0,pi)); caps.append(o)
bottle=link(bpy.data.objects.new('Bottle',None))
for o in parts+caps: o.parent=bottle

# ---------------- phone with an open screen (portal) and a glowing tunnel behind it
def rr(w,h,r,n=10):
    pts=[]
    for cx,cz,a0 in [(w/2-r,h/2-r,0),(-w/2+r,h/2-r,90),(-w/2+r,-h/2+r,180),(w/2-r,-h/2+r,270)]:
        for k in range(n+1):
            a=radians(a0+90*k/n); pts.append((cx+r*cos(a),cz+r*sin(a)))
    return pts
PZ=.82; PW,PH=.80,1.62; SW,SH=.72,1.54
M_PHONE=mat('phone',**{'Base Color':(.006,.007,.01,1),'Metallic':.4,'Roughness':.16,'Coat Weight':1,'Coat Roughness':.02})
M_EDGE=bpy.data.materials.new('edge'); M_EDGE.use_nodes=True
en=M_EDGE.node_tree; en.nodes.remove(en.nodes['Principled BSDF']); em=en.nodes.new('ShaderNodeEmission')
em.inputs['Color'].default_value=(.35,.6,1,1); em.inputs['Strength'].default_value=6
en.links.new(em.outputs[0],en.nodes['Material Output'].inputs[0])
bm=bmesh.new()
A=[bm.verts.new((x,-.04,PZ+z)) for x,z in rr(PW,PH,.11)]; B=[bm.verts.new((x,.04,PZ+z)) for x,z in rr(PW,PH,.11)]
Cc=[bm.verts.new((x,-.04,PZ+z)) for x,z in rr(SW,SH,.075)]; D=[bm.verts.new((x,.04,PZ+z)) for x,z in rr(SW,SH,.075)]
n=len(A); inner=[]
for i in range(n):
    j=(i+1)%n
    bm.faces.new((A[i],A[j],B[j],B[i])); bm.faces.new((A[i],Cc[i],Cc[j],A[j])); bm.faces.new((B[i],B[j],D[j],D[i]))
    inner.append(bm.faces.new((Cc[i],D[i],D[j],Cc[j])))
for f in inner: f.material_index=1
bmesh.ops.recalc_face_normals(bm,faces=bm.faces)
phone=mesh_obj('phone',bm,M_PHONE,smooth=False); phone.data.materials.append(M_EDGE)
bv=phone.modifiers.new('bev','BEVEL'); bv.width=.006; bv.segments=3; bv.limit_method='ANGLE'
bpy.context.view_layer.objects.active=phone; phone.select_set(True); bpy.ops.object.shade_smooth_by_angle(angle=radians(35))

M_TUN=bpy.data.materials.new('tunnel'); M_TUN.use_nodes=True; tn=M_TUN.node_tree; N=tn.nodes
N.remove(N['Principled BSDF'])
def nd(t,**kw):
    x=N.new(t)
    for k,v in kw.items(): setattr(x,k,v)
    return x
uvn=nd('ShaderNodeTexCoord'); sep=nd('ShaderNodeSeparateXYZ'); tn.links.new(uvn.outputs['UV'],sep.inputs[0])
mul=nd('ShaderNodeMath',operation='MULTIPLY'); mul.inputs[1].default_value=10; tn.links.new(sep.outputs['Y'],mul.inputs[0])
flow=nd('ShaderNodeValue'); flow.name='flow'
add=nd('ShaderNodeMath',operation='ADD'); tn.links.new(mul.outputs[0],add.inputs[0]); tn.links.new(flow.outputs[0],add.inputs[1])
fr_=nd('ShaderNodeMath',operation='FRACT'); tn.links.new(add.outputs[0],fr_.inputs[0])
sub=nd('ShaderNodeMath',operation='SUBTRACT'); sub.inputs[1].default_value=.5; tn.links.new(fr_.outputs[0],sub.inputs[0])
ab=nd('ShaderNodeMath',operation='ABSOLUTE'); tn.links.new(sub.outputs[0],ab.inputs[0])
mr=nd('ShaderNodeMapRange'); mr.inputs['From Min'].default_value=0; mr.inputs['From Max'].default_value=.03
mr.inputs['To Min'].default_value=1; mr.inputs['To Max'].default_value=0; tn.links.new(ab.outputs[0],mr.inputs['Value'])
mix=nd('ShaderNodeMix',data_type='RGBA'); mix.inputs['A'].default_value=(.002,.008,.05,1); mix.inputs['B'].default_value=(.35,.6,1,1)
tn.links.new(mr.outputs[0],mix.inputs['Factor'])
fade=nd('ShaderNodeMath',operation='MULTIPLY_ADD'); fade.inputs[1].default_value=-2.2; fade.inputs[2].default_value=2.6
tn.links.new(sep.outputs['Y'],fade.inputs[0])
emt=nd('ShaderNodeEmission'); tn.links.new(mix.outputs['Result'],emt.inputs['Color']); tn.links.new(fade.outputs[0],emt.inputs['Strength'])
tn.links.new(emt.outputs[0],N['Material Output'].inputs[0])
K=40; DEPTH=4.2; bm=bmesh.new(); uvl=bm.loops.layers.uv.new(); loops=[]
for k in range(K+1):
    f=k/K; s=L(1,.3,f)
    loops.append([bm.verts.new((x,.04+f*DEPTH,PZ+z)) for x,z in rr(SW*s,SH*s,.075*s)])
m_=len(loops[0])
for k in range(K):
    for i in range(m_):
        j=(i+1)%m_; fc=bm.faces.new((loops[k][i],loops[k][j],loops[k+1][j],loops[k+1][i]))
        for lp,(u,v) in zip(fc.loops,[(i/m_,k/K),((i+1)/m_,k/K),((i+1)/m_,(k+1)/K),(i/m_,(k+1)/K)]): lp[uvl].uv=(u,v)
bm.faces.new(loops[-1][::-1])
tunnel=mesh_obj('tunnel',bm,M_TUN,smooth=False)

# floor + backdrop glow
bpy.ops.mesh.primitive_plane_add(size=30,location=(0,0,0)); fl=bpy.context.object
fl.data.materials.append(mat('floor',**{'Base Color':(.004,.008,.03,1),'Roughness':.12,'Coat Weight':.5}))
bpy.ops.mesh.primitive_plane_add(size=1,location=(0,7.5,1.6),rotation=(radians(90),0,0)); bdp=bpy.context.object; bdp.scale=(14,9,1)
mb=bpy.data.materials.new('backdrop'); mb.use_nodes=True; bn=mb.node_tree; bn.nodes.remove(bn.nodes['Principled BSDF'])
g=bn.nodes.new('ShaderNodeTexGradient'); g.gradient_type='SPHERICAL'; tc=bn.nodes.new('ShaderNodeTexCoord'); mp=bn.nodes.new('ShaderNodeMapping')
mp.inputs['Location'].default_value=(.5,.45,0); mp.inputs['Scale'].default_value=(1.9,2.6,1)
bn.links.new(tc.outputs['Object'],mp.inputs[0]); bn.links.new(mp.outputs[0],g.inputs[0])
cr=bn.nodes.new('ShaderNodeValToRGB'); cr.color_ramp.elements[0].color=(0,0,0,1); cr.color_ramp.elements[1].color=(.08,.22,.9,1)
bn.links.new(g.outputs['Fac'],cr.inputs[0]); e2=bn.nodes.new('ShaderNodeEmission'); e2.inputs['Strength'].default_value=.45
bn.links.new(cr.outputs[0],e2.inputs[0]); bn.links.new(e2.outputs[0],bn.nodes['Material Output'].inputs[0]); bdp.data.materials.append(mb)
mp.inputs['Location'].default_value=(0,0,0); mp.inputs['Scale'].default_value=(1.25,1.25,1)

w=bpy.data.worlds.new('w'); sc.world=w; w.use_nodes=True; w.node_tree.nodes['Background'].inputs['Color'].default_value=(.001,.002,.008,1)

def area(name,loc,target,energy,size,col=(1,1,1)):
    ld=bpy.data.lights.new(name,'AREA'); ld.energy=energy; ld.size=size; ld.color=col
    o=link(bpy.data.objects.new(name,ld)); o.location=loc
    tr=o.constraints.new('TRACK_TO'); tg=link(bpy.data.objects.new(name+'_t',None)); tg.location=target; tr.target=tg
    return o
area('key',(-1.3,-2.4,1.9),(0,-1.2,.9),90,.9,(1,.97,.94))
area('fill',(1.4,-2.0,1.1),(0,-1.2,.85),30,.8,(.62,.75,1))
area('rimL',(-1.1,.2,1.5),(0,-1.3,.85),140,.8,(.5,.7,1))
area('rimR',(1.1,.2,1.5),(0,-1.3,.85),140,.8,(.5,.7,1))
area('phoneTop',(0,-.8,2.6),(0,0,1.2),25,1.2,(.7,.8,1))
pl=bpy.data.lights.new('bl','POINT'); pl.energy=6; pl.shadow_soft_size=.3; po=link(bpy.data.objects.new('bl',pl)); po.parent=bottle; po.location=(0,-.45,.12)

cd=bpy.data.cameras.new('cam'); cd.lens=50; cd.sensor_fit='VERTICAL'; cd.sensor_height=36; cd.clip_start=.01
cd.dof.use_dof=True; cd.dof.aperture_fstop=4.5
cam=link(bpy.data.objects.new('cam',cd)); cam.rotation_euler=(radians(90),0,0); sc.camera=cam

# ---------------- keyframes (every frame, linear) so the JS-style easing is exact
sc.render.fps=FPS; sc.frame_start=1; sc.frame_end=DUR*FPS
for f in range(0,DUR*FPS+2):
    t=f/FPS; loc,rot=pose(t)
    bottle.location=loc; bottle.rotation_euler=rot; bottle.keyframe_insert('location',frame=f+1); bottle.keyframe_insert('rotation_euler',frame=f+1)
    cam.location=cam_pose(t); cam.keyframe_insert('location',frame=f+1)
    cd.dof.focus_distance=max(.05,loc[1]-cam.location[1]-R*.95); cd.dof.keyframe_insert('focus_distance',frame=f+1)
    flow.outputs[0].default_value=t*.5+math.log(max(.01,3.6-loc[1]))*1.6; flow.outputs[0].keyframe_insert('default_value',frame=f+1)
for ad in [bottle.animation_data,cam.animation_data,M_TUN.node_tree.animation_data]:
    for fc in ad.action.fcurves if hasattr(ad.action,'fcurves') else [fc for l in ad.action.layers for s in l.strips for cb in s.channelbags for fc in cb.fcurves]:
        for kp in fc.keyframe_points: kp.interpolation='LINEAR'

r=sc.render; r.engine='CYCLES'; r.resolution_x=1080; r.resolution_y=1920; r.resolution_percentage=int(os.environ.get('RES',67)); r.use_persistent_data=True
cy=sc.cycles; cy.device='CPU'; cy.samples=int(os.environ.get('SAMPLES',20)); cy.use_adaptive_sampling=True; cy.adaptive_threshold=.03
cy.use_denoising=True; cy.max_bounces=8; cy.transmission_bounces=6; cy.glossy_bounces=4; cy.diffuse_bounces=2; cy.caustics_reflective=False; cy.caustics_refractive=False
r.use_motion_blur=True; r.motion_blur_shutter=.4
sc.view_settings.view_transform='AgX'; sc.view_settings.look='AgX - Medium High Contrast'
r.image_settings.file_format='PNG'

mode=sys.argv[1] if len(sys.argv)>1 else 'still'
if mode=='still':
    os.makedirs(os.path.join(HERE,'stills'),exist_ok=True)
    for t in map(float,(sys.argv[2] if len(sys.argv)>2 else '0.6,2.0,3.9,7').split(',')):
        sc.frame_set(int(round(t*FPS))+1); r.filepath=os.path.join(HERE,'stills',f'still_{t:05.2f}.png'); bpy.ops.render.render(write_still=True)
else:
    f0,f1=int(sys.argv[2]),int(sys.argv[3]); os.makedirs(os.path.join(HERE,'frames'),exist_ok=True)
    for f in range(f0,f1+1):
        p=os.path.join(HERE,'frames',f'{f:04d}.png')
        if os.path.exists(p): continue
        sc.frame_set(f); r.filepath=p; bpy.ops.render.render(write_still=True)
