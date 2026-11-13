"""
Génère les sprites 3D des modules de bikepark (iso 2.5D, golden hour) via Blender.
Lancé sur TITOUS (RTX 4060) :
  blender --background --python blender_modules.py -- OUTDIR
Sortie : OUTDIR/<type>.png (fond transparent), ratio ~ 100x70.

Modules : jump, double, table, berm, pumptrack, northshore.
Convention : rider roule vers +X ; lip/sortie à droite. Lumière NW golden hour.
"""
import bpy, bmesh, math, sys, os
from mathutils import Vector

argv = sys.argv
OUTDIR = argv[argv.index("--") + 1] if "--" in argv else os.getcwd()
os.makedirs(OUTDIR, exist_ok=True)

# ---------------------------------------------------------------- scene reset
def reset_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)

# ---------------------------------------------------------------- materials
def mat(name, rgb, rough=0.9):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    bsdf = m.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = (*rgb, 1.0)
    bsdf.inputs["Roughness"].default_value = rough
    if "Specular IOR Level" in bsdf.inputs:
        bsdf.inputs["Specular IOR Level"].default_value = 0.15
    return m

DIRT = (0.60, 0.42, 0.21)
WOOD = (0.66, 0.46, 0.14)
WOOD_D = (0.34, 0.22, 0.07)

# ---------------------------------------------------------------- mesh helpers
def obj_from_bm(bm, name, material):
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me); bm.free()
    ob = bpy.data.objects.new(name, me)
    bpy.context.collection.objects.link(ob)
    ob.data.materials.append(material)
    # shade smooth-ish with autosmooth via modifier look: keep flat for low-poly poster
    return ob

def extruded_profile(name, profile_xz, width, material):
    """profile_xz : liste (x,z) polygone fermé (ground à z=0). Extrudé en Y sur `width`."""
    bm = bmesh.new()
    y0, y1 = -width / 2.0, width / 2.0
    front = [bm.verts.new((x, y0, z)) for (x, z) in profile_xz]
    back = [bm.verts.new((x, y1, z)) for (x, z) in profile_xz]
    bm.faces.new(front)
    bm.faces.new(list(reversed(back)))
    n = len(profile_xz)
    for i in range(n):
        a, b = front[i], front[(i + 1) % n]
        c, d = back[(i + 1) % n], back[i]
        bm.faces.new((a, b, c, d))
    bm.normal_update()
    return obj_from_bm(bm, name, material)

# ---------------------------------------------------------------- modules
def build_jump():
    # kicker : rampe concave qui remonte vers un lip marqué à droite puis drop
    prof = [(0,0),(2.5,0.12),(4.6,0.8),(6.1,2.0),(7.1,3.1),(7.5,3.6),(7.5,0)]
    return extruded_profile("jump", prof, 4.0, mat("dirt", DIRT))

def build_table():
    prof = [(0,0),(2.6,1.9),(3.4,2.3),(8.2,2.3),(9.0,1.9),(11.6,0)]
    return extruded_profile("table", prof, 3.4, mat("dirt", DIRT))

def build_double():
    m = mat("dirt", DIRT)
    pr = [(0,0),(2.2,0.1),(4.0,0.6),(5.3,1.5),(6.2,2.6),(6.6,3.0),(6.6,0)]
    GAP = 3.0
    a = extruded_profile("double_a", pr, 3.2, m)             # lip à x=6.6
    prm = [(-x, z) for (x, z) in pr]                          # miroir : lip à x=-6.6
    b = extruded_profile("double_b", prm, 3.2, m)
    b.location.x = 6.6 + GAP + 6.6                            # base à droite, lip face au gap
    return [a, b]

def build_berm():
    # virage relevé : balaye un profil banqué le long d'un arc 90°.
    # Profil (coupe) : du pied intérieur (bas) vers la lèvre extérieure (haut), banqué.
    R_in, R_out = 3.0, 7.2   # rayons intérieur/extérieur
    H = 3.4                  # hauteur de la lèvre extérieure
    segs = 24
    rings = []  # chaque ring = (inner_bottom, mid, outer_top)
    bm = bmesh.new()
    grid = []
    # profil paramétré t=0 (pied intérieur sol) -> t=1 (lèvre extérieure haute)
    prof_t = [(R_in, 0.0), (R_in+0.8, 0.15), ( (R_in+R_out)/2, H*0.45), (R_out-0.9, H*0.9), (R_out, H)]
    for i in range(segs + 1):
        a = (math.pi / 2) * (i / segs)   # 0..90°
        ca, sa = math.cos(a), math.sin(a)
        row = []
        for (r, z) in prof_t:
            row.append(bm.verts.new((r * ca, r * sa, z)))
        grid.append(row)
    cols = len(prof_t)
    for i in range(segs):
        for j in range(cols - 1):
            v00 = grid[i][j]; v01 = grid[i][j+1]
            v10 = grid[i+1][j]; v11 = grid[i+1][j+1]
            bm.faces.new((v00, v10, v11, v01))
    # fond + bouchons d'extrémité pour fermer (épaisseur visuelle)
    # bas intérieur -> bas extérieur au sol
    base_prof = [(r, 0.0) for (r, z) in prof_t]
    for i in range(segs):
        a0 = (math.pi/2)*(i/segs); a1=(math.pi/2)*((i+1)/segs)
    bm.normal_update()
    ob = obj_from_bm(bm, "berm", mat("dirt", DIRT))
    # recentrer
    ob.location = (-(R_out)/2, -(R_out)/2, 0)
    return ob

def build_pumptrack():
    # bande avec 3 rollers (bosses sinus), descend aux bords jusqu'au sol
    L = 13.0; W = 3.2; nx = 60
    amp = 1.5; humps = 3.0
    bm = bmesh.new()
    top = []
    for i in range(nx + 1):
        x = L * i / nx
        s = math.sin(math.pi * humps * i / nx)
        z = max(0.0, amp * s)
        top.append((x, z))
    y0, y1 = -W/2, W/2
    vf = [bm.verts.new((x, y0, z)) for (x, z) in top]
    vb = [bm.verts.new((x, y1, z)) for (x, z) in top]
    # surface top
    for i in range(nx):
        bm.faces.new((vf[i], vf[i+1], vb[i+1], vb[i]))
    # jupes avant/arrière (descendent au sol)
    gf0=[bm.verts.new((x,y0,0)) for (x,_) in top]
    gb0=[bm.verts.new((x,y1,0)) for (x,_) in top]
    for i in range(nx):
        bm.faces.new((gf0[i], gf0[i+1], vf[i+1], vf[i]))
        bm.faces.new((vb[i], vb[i+1], gb0[i+1], gb0[i]))
    bm.normal_update()
    return obj_from_bm(bm, "pumptrack", mat("dirt", DIRT))

def build_northshore():
    objs = []
    wood = mat("wood", WOOD, rough=0.6)
    woodd = mat("woodd", WOOD_D, rough=0.7)
    L, W, H = 10.0, 3.4, 1.6
    dt = 0.36  # demi-épaisseur dalle
    # dalle de tablier pleine (ombre au sol propre)
    bpy.ops.mesh.primitive_cube_add(size=1, location=(L/2, 0, H))
    d = bpy.context.object; d.scale = (L/2, W/2, dt); d.name = "deck"
    d.data.materials.append(wood); objs.append(d)
    # rainures de planches (le long de X, en retrait des bords, sur le dessus)
    npl = 7
    for k in range(1, npl):
        y = -W/2 + k * (W / npl)
        bpy.ops.mesh.primitive_cube_add(size=1, location=(L/2, y, H + dt))
        g = bpy.context.object; g.scale = (L/2 - 0.5, 0.05, 0.05); g.name = f"groove{k}"
        g.data.materials.append(woodd); objs.append(g)
    # poteaux francs aux 4 coins (épais, sous la dalle)
    ptop = H - dt
    for x in (1.3, L - 1.3):
        for y in (-W/2 + 0.6, W/2 - 0.6):
            bpy.ops.mesh.primitive_cube_add(size=1, location=(x, y, ptop/2))
            p = bpy.context.object; p.scale = (0.46, 0.46, ptop/2)
            p.data.materials.append(woodd); objs.append(p)
    return objs

BUILDERS = {
    "jump": build_jump, "double": build_double, "table": build_table,
    "berm": build_berm, "pumptrack": build_pumptrack, "northshore": build_northshore,
}

# ---------------------------------------------------------------- render setup
def setup_world_and_light():
    # soleil golden hour NW (haut-gauche-avant), chaud
    sun_data = bpy.data.lights.new("Sun", type='SUN')
    sun_data.energy = 3.2
    sun_data.color = (1.0, 0.82, 0.55)
    sun_data.angle = math.radians(2.0)
    sun = bpy.data.objects.new("Sun", sun_data)
    bpy.context.collection.objects.link(sun)
    # direction : vient du NW en hauteur -> incline
    sun.rotation_euler = (math.radians(52), math.radians(8), math.radians(-128))
    # ambiance douce chaude (world) pour déboucher les ombres
    w = bpy.data.worlds.new("W"); bpy.context.scene.world = w
    w.use_nodes = True
    bg = w.node_tree.nodes.get("Background")
    bg.inputs[0].default_value = (0.55, 0.52, 0.48, 1.0)
    bg.inputs[1].default_value = 0.35
    # fill area light (depuis l'avant droit, froid léger pour contraste)
    fl = bpy.data.lights.new("Fill", type='AREA'); fl.energy=120; fl.size=14
    fl.color=(0.75,0.82,1.0)
    flo = bpy.data.objects.new("Fill", fl); bpy.context.collection.objects.link(flo)
    flo.location=(14,-10,10); flo.rotation_euler=(math.radians(55),0,math.radians(55))

def setup_camera(center, size):
    cam_data = bpy.data.cameras.new("Cam")
    cam_data.type = 'ORTHO'
    cam_data.ortho_scale = size * 1.7
    cam = bpy.data.objects.new("Cam", cam_data)
    bpy.context.collection.objects.link(cam)
    bpy.context.scene.camera = cam
    # vue 3/4 iso : depuis l'avant-droite en hauteur
    d = Vector((1.0, -1.15, 0.92)).normalized()
    cam.location = center + d * 60
    # Viser le CONTACT-SOL (z=0) → ce point se projette au centre de l'image,
    # donc dans l'app un marker ancré 'center' pose le module pile au sol.
    aim = Vector((center.x, center.y, 0.0))
    cam.location = aim + d * 60
    empt = bpy.data.objects.new("Aim", None); bpy.context.collection.objects.link(empt)
    empt.location = aim
    c = cam.constraints.new('TRACK_TO'); c.target = empt
    c.track_axis='TRACK_NEGATIVE_Z'; c.up_axis='UP_Y'

def frame_objects(objs):
    mn = Vector(( 1e9, 1e9, 1e9)); mx = Vector((-1e9,-1e9,-1e9))
    for ob in objs:
        for corner in ob.bound_box:
            wc = ob.matrix_world @ Vector(corner)
            mn = Vector((min(mn[i],wc[i]) for i in range(3)))
            mx = Vector((max(mx[i],wc[i]) for i in range(3)))
    center = (mn + mx) / 2
    size = max((mx - mn).x, (mx - mn).y, (mx - mn).z)
    return center, size

def add_shadow_catcher(center, size):
    bpy.ops.mesh.primitive_plane_add(size=size * 6, location=(center.x, center.y, 0))
    ob = bpy.context.object
    ob.name = "ShadowCatcher"
    ob.is_shadow_catcher = True
    return ob

def setup_render():
    sc = bpy.context.scene
    sc.render.engine = 'CYCLES'
    sc.cycles.samples = 128
    sc.cycles.use_denoising = True
    sc.render.resolution_x = 700
    sc.render.resolution_y = 490
    sc.render.film_transparent = True
    try:
        prefs = bpy.context.preferences.addons['cycles'].preferences
        for dt in ('OPTIX','CUDA'):
            try:
                prefs.compute_device_type = dt
                prefs.get_devices()
                if any(d.type != 'CPU' for d in prefs.devices):
                    for d in prefs.devices: d.use = (d.type != 'CPU')
                    sc.cycles.device = 'GPU'
                    print("GPU backend:", dt)
                    break
            except Exception as e:
                print("device", dt, "fail", e)
    except Exception as e:
        print("GPU setup failed, CPU:", e)

def render_all():
    setup_render()
    for name, fn in BUILDERS.items():
        reset_scene()
        setup_render()  # world/scene reset wipes; re-apply render settings
        setup_world_and_light()
        res = fn()
        objs = res if isinstance(res, list) else [res]
        bpy.context.view_layer.update()  # applique les .location avant de lire matrix_world
        center, size = frame_objects(objs)
        setup_camera(center, size)
        add_shadow_catcher(center, size)
        bpy.context.scene.render.filepath = os.path.join(OUTDIR, name + ".png")
        print("RENDER", name, "center", center, "size", round(size,2))
        bpy.ops.render.render(write_still=True)
    print("DONE render ->", OUTDIR)

render_all()
