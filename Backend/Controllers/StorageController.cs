using Backend.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;
using System.ComponentModel.DataAnnotations;

namespace Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class StorageController : ControllerBase
{
    private readonly IStorageService _storageService;

    public StorageController(IStorageService storageService)
    {
        _storageService = storageService;
    }

    /// <summary>
    /// Uploads an image to Supabase Storage.
    /// </summary>
    /// <param name="file">The image file to upload.</param>
    /// <returns>The public URL of the uploaded image.</returns>
    [HttpPost("upload")]
    public async Task<IActionResult> UploadImage([Required] IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest("No file uploaded.");

        // Validate file type (optional, but recommended)
        if (!file.ContentType.StartsWith("image/"))
            return BadRequest("Only image files are allowed.");

        try
        {
            // "images" is the bucket name we will create in Supabase
            var publicUrl = await _storageService.UploadFileAsync(file, "images", "uploads");
            return Ok(new { Url = publicUrl });
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Internal server error: {ex.Message}");
        }
    }
}
